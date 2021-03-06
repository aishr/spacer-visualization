import * as React from 'react';

import '../styles/NodeDetails.css';
import {toDiff} from "../helpers/diff";
import {lemmaColours} from "../helpers/network";
import {
    cleanExprOperators,
    getCleanExprList, getIndexOfLiteral,
    getOp, reorder
} from "../helpers/readable";
type Props = {
    nodes: any,
    name: string
    PobLemmasMap: {},
    ExprMap: {},
    layout: string,
    expr_layout: "SMT" | "JSON",
    saveExprs: () => void,
    relatedExprMap: any
};

type State = {
    transformationFlag: boolean
}

export default class NodeDetails extends React.Component<Props, State> {

    keep = false; // hack to skip each second event generated by Sortable
    constructor(props) {
        super(props);
        this.state = {
            transformationFlag: false
        }
    }

    type_map = {
        "EQUALS": "= ",
        "PLUS": "+ ",
        "TIMES": "* ",
        "LT": "< ",
        "LE": "<= ",
        "GT": "> ",
        "GE": ">= ",
        "SYMBOL": "",
        "0_REAL_CONSTANT": ""
    };

    node_to_string(n: Object, is_root: Boolean):string{
        let result = "";
        let args = "";
        const nl = is_root?"\n":"";
        //build args 
        if (Array.isArray(n["content"])){
            for(const arg of n["content"]){
                args+=this.node_to_string(arg, false)+nl
            }
        }else{
            args+=n["content"]
        }
        //build node
        if (n["type"] in this.type_map){
            if(this.type_map[n["type"]]===""){
                result = " "+ args
            }else{
                result = "(" + this.type_map[n["type"]] + args + ")"
            }
        }else{
            result = "(" + n["type"] + nl + args + ")"
        }
        return result
    }
    getLemmaList(node) {
        let lemma_list: JSX.Element[] = [];
        if (node.event_type === "EType.EXP_POB") {
            lemma_list.push(<h2 key ="lemma-title"> Lemmas summarization </h2>);
            if (node.exprID in this.props.PobLemmasMap){
                let lemmas = this.props.PobLemmasMap[node.exprID];
                for (const lemma of lemmas){
                    let colorIndex = lemmas.indexOf(lemma);
                    let lemmaStyle = {
                        color: lemmaColours[colorIndex]
                    };
                    lemma_list.push(<h3 style={lemmaStyle} key={"lemma-header-"+ lemma[0]}>ExprID: {lemma[0]}, From: {lemma[1]} to {lemma[2]}</h3>);
                    let expr = this.props.ExprMap[lemma[0]].edited;
                    if (typeof expr === "string"){
                        if (Object.keys(this.props.relatedExprMap).length > 0){
                            let keys = Object.keys(this.props.relatedExprMap);
                            for (let i = 0; i < keys.length; i++){
                                let exprData = this.props.relatedExprMap[keys[i]];
                               if (expr === exprData.readable) {
                                   expr = exprData.edited;
                                   break;
                               }
                            }
                        }
                        let exprList = getCleanExprList(expr, "\n");
                        let implies = -1;
                        for (let i = 0; i < exprList.length; i++){
                            if (exprList[i].includes("=>")){
                                implies = i;
                                break;
                            }
                        }
                        exprList.map((literal, key) => {
                            let lemmaColour = {
                                color: "black"
                            }
                            if (implies !== -1){
                                if (key > implies){
                                    lemmaColour.color = "darkblue";
                                }
                            }
                            if (key !== exprList.length - 1) {
                                lemma_list.push(<pre style={lemmaColour} onClick={this.addLemma.bind(this, lemma[0])} key={"lemma-expr-"+lemma[0] + key}>{literal}</pre>);
                            }
                            else {
                                lemma_list.push(<pre style={lemmaColour} onClick={this.addLemma.bind(this, lemma[0])}
                                                     key={"lemma-expr-" + lemma[0] + key}>{literal}</pre>);
                            }
                        });
                    }
                    else {
                        lemma_list.push(<pre>{expr}</pre>);
                    }
                }
            }
        }
        return lemma_list;
    }
    
    addLemma(lemmaId, e) {
        let expr = this.props.ExprMap[lemmaId].readable;
        let exprList = getCleanExprList(expr, getOp(expr));
        let literal = (cleanExprOperators(e.target.innerText));
        literal = literal.trim();
        let index = getIndexOfLiteral(exprList, literal);
        let lhs = this.props.ExprMap[lemmaId].lhs;
        if (lhs.includes(index)){
            lhs.splice(lhs.indexOf(index), 1);
        }
        else {
            lhs.push(index)
        }
        
        this.props.ExprMap[lemmaId].lhs = lhs;
        this.props.ExprMap[lemmaId].edited = reorder(expr, lhs, getOp(expr));
        this.props.ExprMap[lemmaId].changed = lhs.length !== 0;
        this.props.saveExprs();
        this.forceUpdate();
        
    }

    async transformExprs() {
        this.setState({
            transformationFlag: false
        });
        const response = await fetch("http://localhost:5000/spacer/transform_exprs", {
            method: 'POST',
            mode :'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }, body : JSON.stringify({
                exp_path: this.props.name
            })
        });

        let responseData = await response.json();
        let tExprMap = responseData["t_expr_map"]
        Object.keys(tExprMap).forEach((key) => {
            this.props.ExprMap[key].edited = tExprMap[key]['Edited'];
            this.props.ExprMap[key].lhs = tExprMap[key]['Lhs'];
        });
        this.props.saveExprs();
        this.setState({
            transformationFlag: true
        });
        this.forceUpdate();
        

    }

    render() {
        let node1, node2;
        
        if (this.props.nodes.length > 1){
            node1 = this.props.nodes[0];
            node2 = this.props.nodes[1];
        }
        return (
            <div>
                {this.props.nodes.length > 1 && <section className='component-node-details details-diff'>
                    <article>
                        <h2>Diff (Node: <strong>{node1.nodeID}</strong> vs. Node: <strong>{node2.nodeID}</strong>)</h2>
                        {toDiff(node1.expr.readable, node2.expr.readable).map((part, key) => (
                            <span key={key} className={part.added ? "green" : part.removed ? "red" : "black"}>
                                {part.value}
                            </span>
                        ))}
                    </article>
                </section>}
                {this.props.nodes.map((node, key) => {
                    let additional_info ="type:" + node.event_type + " level:" + node.level;
                    let lemma_list = this.getLemmaList(node);

                    let expr = node.expr.readable;
                    if (this.props.expr_layout==="SMT") {
                        console.log(node.expr);
                    }
                    else {
                        /* expr = JSON.stringify(this.props.node.ast_json, null, 2); */
                        if (node.ast_json) {
                            expr += this.node_to_string(node.ast_json, true);
                        }
                    }
                    const classNameTop = "component-node-details details-top-" + key;
                    const classNameBottom = "component-node-details details-bottom-" + key;
                    return (
                        <div key = {key}>
                            <section className={classNameTop}>
                                <article>
                                    <h2>Node <strong>{node.nodeID}, </strong>Expr <strong> {node.exprID} </strong>,
                                        Parent <strong> {node.pobID}  </strong></h2>
                                    <h3>{additional_info}</h3>
                                    <pre className={this.props.nodes.length === 1 ? "black" : node === node1 ? "red" : "green" }>{expr}</pre>
                                </article>
                            </section>
                            {lemma_list.length > 0 && <section className={classNameBottom}>
                                <article>
                                    {lemma_list}
                                    <button onClick={this.transformExprs.bind(this)}>Apply Transform</button>
                                    {this.state.transformationFlag && <p>Transformation Complete</p>}
                                </article>
                            </section>}
                        </div>
                    );
                })}
            </div>
);




        /* let additional_info ="type:" + this.props.node.event_type + " level:" + this.props.node.level */
        /* let lemma_list = new Array(); */

        //if(this.props.node.event_type == "EType.EXP_POB"){
        //    lemma_list.push(<h2 key ="lemma-title"> Lemmas summarization </h2>)
        //    if(this.props.node.exprID in this.props.PobLemmasMap){
        //        let lemmas = this.props.PobLemmasMap[this.props.node.exprID]
        //        for (const lemma of lemmas){
        //            lemma_list.push(<h3 key={"lemma-header-"+ lemma[0]}>ExprID: {lemma[0]}, From: {lemma[1]} to {lemma[2]}</h3>)
        //            lemma_list.push(<pre key={"lemma-expr-"+lemma[0]}>{this.props.ExprMap[lemma[0]]}</pre>)
        //        }
        //    }
        //}

        //let expr = ""
        //if(this.props.expr_layout=="SMT"){
        //    expr = this.props.node.expr
        //}else{
        //    /* expr = JSON.stringify(this.props.node.ast_json, null, 2); */
        //    if(this.props.node.ast_json){
        //        expr += this.node_to_string(this.props.node.ast_json, true);
        //    }
        //}

        //return (
        //    <div >
        //        <section className= { 'component-node-details details-top'} >
        //        <article>
        //        <h2>Node <strong>{this.props.node.nodeID}, </strong>Expr < strong > { this.props.node.exprID } </strong>, Parent <strong> {this.props.node.pobID}  </strong></h2 >
        //        <h3>{additional_info}</h3>
        //        <pre>{expr}</pre>
        //        </article>
        //        </section>
        //        <section className= { 'component-node-details details-bottom'} >
        //            <article>
        //                {lemma_list}
        //            </article>
        //        </section>
        //    </div>
        //);

    }

}

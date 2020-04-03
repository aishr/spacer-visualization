import {parse} from "s-exify";

const negateMap = {
    "<": ">=",
    ">": "<=",
    "=": "!=",
    "<=": ">",
    ">=": "<",
    "!=": "=",
    "&&": "||",
    "||": "&&"
};

const logSym = ["&&", "||"];

export function toReadable(expr, varList) {
    if (expr[0] !== "("){
        expr = "(" + expr + ")";
    }
    let parsedResult = parseResult(parse(expr), "");
    if (varList.length === 0 ){
        return parsedResult;
    }
    return replaceVarNames(parsedResult, varList);
}

function parseResult(lst, sep) {
    //symbols for logical relations
    let logSym = {
        "and": "&&",
        "or": "||"
    };

    //symbols for mathematical operations
    //Note: "-" is not included because negative numbers are in the form (- x)
    let logOp = ["!=", "=", "<=", ">=", ">", "<", "+", "*", "/"];

    //empty list should return empty string
    if (lst.length < 1){
        return "";
    }

    //logical symbol should be inserted between each child clause
    if (lst[0] in logSym) {
        return parseResult(lst.splice(1), logSym[lst[0]]);
    }

    //reorders to put operators between operands
    //Note: accounts for "-" denoting the subtraction of 2 numbers, (- x y)
    if (logOp.indexOf(lst[0]) >= 0 || (lst[0] === "-" && lst.length === 3)){
        return "(" + parseResult(lst[1], "") + " " + lst[0] + " " + parseResult(lst[2], "") + ")";
    }

    //handles indexing into an array
    if (lst[0] === "select") {
        return lst[1] + "[" + lst[2] + "]";
    }

    //Adds not symbol (!) to beginning of clause
    if (lst[0] === "not") {
        lst[1][0] = negateMap[lst[1][0]];
        return parseResult(lst[1], "")
    }

    //prevents trailing logical symbol
    if (sep !== "" && lst.length === 1){
        return parseResult(lst[0], "");
    }

    //actual place where logical symbol gets placed between clauses
    if (sep !== "") {
        return parseResult(lst[0], "") + " " + sep + parseResult(lst.splice(1), sep);
    }

    //handler for negative numbers which come in the form (- x)
    if (lst[0] === "-"){
        return lst[0] + lst[1];
    }

    //handler for denoting invariants. Ex. Inv (...)
    if (typeof(lst[0]) === 'string' && Array.isArray(lst) && lst.length > 1){
        return lst[0] + ": (" + parseResult(lst[1], "") + ")";
    }

    return lst;
}

function replaceVarNames(expr, varList) {
    if (typeof expr === "string") {
        let newList = varList.split(" ");
        for (let i = 0; i < newList.length; i++) {
            let regex = new RegExp("Inv_" + i + "_n", "gi");
            expr = expr.replace(regex, newList[i]);
        }
    }
    return expr;
}

export function reorder(expr, rhs, lhs, op){
    if (typeof expr !== "string") return expr;
    let rhsFinal:Number[] = [];
    let lhsFinal:Number[] = [];
    let exprList = expr.split(op);
    let result = "";
    for (let i = 0; i < exprList.length; i++){
        if (rhs.indexOf(i) > -1) {
            if (rhsFinal.length === 0){
                result = negate(exprList[i]) + result;
            }
            else {
                result = negate(exprList[i]) + " " + negateMap[op] + " " + result;
            }
            rhsFinal.push(i);
            
        }
        else {
            if (i === exprList.length - 1 && rhsFinal.length === 0) {
                result = negate(exprList[i]) + result;
                rhsFinal.push(i);
            }
            else {
                if (lhsFinal.length === 0) {
                    result = result + " -> " + exprList[i];
                }
                else {
                    result = result + " " + op + " " + exprList[i]
                }
               lhsFinal.push(i); 
            }
        }
    }
    return result;
}

function detectReorderPattern(expr, userExpr){
    if (userExpr.includes("->")) {
        let userExprClauses = userExpr.split("->");
        let leftSideExprs = getLiterals(userExprClauses[0]);
        let rightSideExprs = getLiterals(userExprClauses[1]);
        
        
        
        let exprList
    }
}

function getLiterals(expr) {
    for (let sym in logSym){
        if (expr.includes(sym)) {
            return expr.split(sym);
        }
    }
}

function equivalence(expr, reorder:number) {
    let sym = "";
    for (let i = 0; i < logSym.length; i++) {
        if (expr.includes(logSym[i])){
            sym = logSym[i];
            break;
        }
    }
    let result = "";
    if (typeof expr === "string") {
        let exprList = expr.split(sym);
        if (reorder >= 0 && reorder < exprList.length) {
            for (let i = 0; i < exprList.length; i++) {
                if (i < reorder) {
                    result += negate(exprList[i]) + " " + negateMap[sym] + " ";
                }
                else if (i === reorder){
                    result += negate(exprList[i]) + " -> ";
                }
                else if (i === exprList.length - 1){
                    result += exprList[i];
                }
                else {
                    result += exprList[i] + " " + sym + " ";
                }
            }
        }
    }
    return result;
}

function negate(expr) {
    let exprList = expr.split(" ");
    return expr.replace(exprList[1], negateMap[exprList[1]]);
}

export function getOp(expr) {
    if (expr.includes("&&")) {
        return "&&";
    }
    else {
        return "||";
    }
}

export function getIndexOfLiteral(exprList, literal){
    for (let i = 0; i < exprList.length; i++){
        if (literal === exprList[i]){
            return i;            
        }
    }
}

export function getCleanExprList(expr){
    let exprList = expr.split(getOp(expr));
    for (let i = 0; i < exprList.length; i++){
        exprList[i] = exprList[i].trim();
    }
    
    return exprList;
}

export function getVariables(literal) {
    let regex = /([a-zA-Z])+/g;
    return literal.match(regex);
}

export function getProcesses(literal) {
    let regex = /(\[[0-9]+\])/g;
    return literal.match(regex);
}

export function getProcessVariables(literal) {
    let regex = /([a-zA-Z]+\[[0-9]+\])/g;
    return literal.match(regex);
}

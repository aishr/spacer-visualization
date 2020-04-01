import * as React from 'react';
import { NavigationBar } from "./NavigationBar";
import App from "./App";
import '../styles/AppWrapper.css';

type Props = {
    endpoint: string,
    name: string,
    problem: string,
    exp_path: string,
    spacerUserOptions: string,
    mode: "proof" | "replay" | "iterative"
    hideBracketsAssoc: boolean,
    nonStrictForNegatedStrictInequalities: boolean, 
    orientClauses: boolean,
    varNames: string
};

export class AppWrapper extends React.Component<Props, {}> {
    render() {
        return (
            <div id="appWrapper">
                <App 
                    endpoint = {this.props.endpoint}
                    name = {this.props.name}
                    problem={this.props.problem}
                    exp_path = {this.props.exp_path}
                    spacerUserOptions={this.props.spacerUserOptions}
                    mode={this.props.mode}
                    hideBracketsAssoc={this.props.hideBracketsAssoc}
                    nonStrictForNegatedStrictInequalities={this.props.nonStrictForNegatedStrictInequalities}
                    orientClauses={this.props.orientClauses}
                    varNames={this.props.varNames}
                />
            </div>
        )
    }
}


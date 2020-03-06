import * as React from 'react';

import { Dag } from '../model/dag';
import NodeMenu from './NodeMenu';
import Search from './Search';
import '../styles/NodeCard.css';

type Props = {
  dag: Dag | null,
  currentTime: number,
  nodeSelection: number[],
  onUpdateNodeSelection: (selection: number[]) => void,
  onSelectParents: () => void,
  onSelectChildren: () => void,
  onSelectCommonConsequences: () => void
};
export default class NodeCard extends React.Component<Props, {}> {

  render() {
    return (
      <section className="component-node-card">
        <article>
          <h2>Select Nodes</h2>
          <NodeMenu
            nodeSelection={this.props.nodeSelection}
            onSelectParents={this.props.onSelectParents}
            onSelectChildren={this.props.onSelectChildren}
            onSelectCommonConsequences={this.props.onSelectCommonConsequences}
          />
          <Search
            dag={this.props.dag}
            currentTime={this.props.currentTime}
            onUpdateNodeSelection={this.props.onUpdateNodeSelection}
          />
        </article>
      </section>
    );
  }

}

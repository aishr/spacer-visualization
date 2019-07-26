import * as React from 'react';

import './NodeCard.css';
import NodeMenu from './NodeMenu';


export default class NodeCard extends React.Component {

  state = {nodeSelection: []};

  componentDidUpdate(prevProps) {
    if (this.props.nodeSelection !== prevProps.nodeSelection) {
      this.setState({
        nodeSelection: this.props.nodeSelection
      });
    }
  }

  render() {
    const {nodeSelection} = this.state;

    const nodeInfo = nodeSelection.length === 1 ? '1 node' : `${nodeSelection.length} nodes`;

    return (
      <section className="component-node-card">
        <article>
          <h2>Select Nodes</h2>
          <NodeMenu
            nodeSelection={nodeSelection}
            onSelectParents={this.props.onSelectParents}
            onSelectChildren={this.props.onSelectChildren}
            onFindCommonConsequences={this.props.onFindCommonConsequences}
          />
          <input type="text"
                 id="search"
                 className="sidebar-input spaced"
                 placeholder="Search for a node ..."
                 onKeyUp="search(this.value)"/>
          <ul id="searchResults"/>
        </article>
        <section>
          <article id="nodeDetails" className="hidden">
            <h2>Node <span id="nodeDetailsId"/></h2>
            <h3 id="nodeDetailsRule">&nbsp;</h3>
            <p id="nodeDetailsClause"/>
          </article>
          <small id="nodeInfo"><strong>{nodeInfo}</strong> selected</small>
        </section>
      </section>
    );
  }

}

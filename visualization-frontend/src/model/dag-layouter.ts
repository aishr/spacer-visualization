import { assert } from '../model/util';
import Dag from '../model/dag';
import { runViz } from './callViz';

const PLAIN_PATTERN = /^(\d+) ([0-9.]+) ([0-9.]+).*$/g;

export class DagLayouter {

  static async layout(dag: Dag) {
    // generate dot string
    const dotString = DagLayouter.dagToDotString(dag);
    
    // use viz to compute layout for dag given as dotstring
    // note that viz returns the layout as a string
    const layoutString = await runViz(dotString);

    // parse the layout string into array of network-nodes
    DagLayouter.parseLayoutString(layoutString, dag);
  };

  static dagToDotString(dag: Dag): string {
    // TODO: make sure boundary nodes are handled properly
    // TODO: document
    const inputStrings = new Array<string>();
    const preprocessingStrings = new Array<string>();
    const otherStrings = new Array<string>();
    const edgeStrings = new Array<string>();
    for (const node of dag.nodes.values()) {
      // assert(node.position === null, "the dag has already been layouted!");
      if (node.isFromPreprocessing) {
        if(dag.nodeIsInputNode(node.id)) {
          inputStrings.push(`${node.id} [label="${node.toString()}"]`);
        } else {
          preprocessingStrings.push(`${node.id} [label="${node.toString()}"]`);
        }
      }
    }
    for (const node of dag.nodes.values()) {
      if (!node.isFromPreprocessing) {
        otherStrings.push(`${node.id} [label="${node.toString()}"]`);
      }
    }

    for (const node of dag.nodes.values()) {
      for (const parentId of node.parents) {
        edgeStrings.push(`${parentId} -> ${node.id}`)
      }
    }

    const inputString = "   subgraph inputgraph {\n      rank=source;\n      " + inputStrings.join(";\n      ") + "\n   }";
    const preprocessingString = "   subgraph preprocessinggraph {\n      rank=same;\n      " + preprocessingStrings.join(";\n      ") + "\n   }";
    const otherstring = "   subgraph othergraph {\n      " + otherStrings.join(";\n      ") + "\n   }";
    const edgeString = edgeStrings.join(";\n   ");

    const dotString =  "digraph {\n\n" + inputString + "\n\n" + preprocessingString + "\n\n" + otherstring + "\n\n   " + edgeString + "\n}";
    
    return dotString;
  };

  static parseLayoutString(layoutString: string, dag: Dag) {
    let firstEdgeLineIndex = layoutString.includes('\nedge') ? layoutString.indexOf('\nedge') : layoutString.length;
    // split layoutString to array of strings describing positions of nodes
    const parsedNodeLines = layoutString
      .substr(0, firstEdgeLineIndex) // ignore remaining part of string describing edges
      .split('\nnode ') //split lines
      .slice(1) // ignore first line describing graph
      .map(line => line.substr(0, line.indexOf('"'))) // ignore remaining part of line causing problems with line breaks
      .map((line) => line.matchAll(PLAIN_PATTERN).next().value); // parse each remaining line
    parsedNodeLines.forEach(line => {
      assert(line !== undefined); // check that each remaining line was successfully parsed
	  });
	
    // update SatNode for each nodeString
    for (const parsedNodeLine of parsedNodeLines) {
      const [, idString, xString, yString] = parsedNodeLine;
      const id = parseInt(idString, 10);
      const x = parseFloat(xString);
      const y = parseFloat(yString);

      dag.get(id).position = [x,y];
    }
  }

}
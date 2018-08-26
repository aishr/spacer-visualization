"""A parser for vampire output."""

__all__ = 'parse', 'parse_line'

import coloredlogs
import logging
import re

from visualizer.parsing.inference_node import InferenceNode
from visualizer.tree import Tree

coloredlogs.install(
    level='DEBUG', fmt='%(name)s [%(levelname).1s] %(message)s'
)
LOG = logging.getLogger('VampireParser')
OUTPUT_PATTERN = re.compile(
    r'^\[SA\] active: ([\d]+)\. (.*) ?\[(\D*) ?([\d,]*)\]$'
)


def parse(vampire_output):
    """Parse vampire output.

    Currently, only active clauses can be handled.
    """

    nodes = {}

    def add_as_child(node):
        for parent in node.parents:
            try:
                nodes[parent].children.add(node.number)
            except KeyError:
                LOG.info(
                    "Clause %d is derived from preprocessing clause %d", node.number, parent)
                parent_node = InferenceNode(parent, None, None, None)
                parent_node.children.add(node.number)
                nodes[parent] = parent_node

    lines = vampire_output.split('\n')
    for line in lines:
        try:
            current_node = parse_line(line)
            nodes[current_node.number] = current_node
            add_as_child(current_node)
        except AttributeError:
            LOG.warning(
                "'%s' does not match the pattern and will be skipped", line)

    leaves = {node for node in nodes.values() if not node.children}
    return Tree(nodes, leaves)


def parse_line(line):
    """Parse a line of vampire output.

    Attempt to extract clause information from the given line. Throw an AttributeError if the line cannot be matched.
    """
    number, clause, rule, parents = re.match(OUTPUT_PATTERN, line).groups()
    number = int(number)
    clause = clause.rstrip()
    rule = rule.rstrip()
    parents = {int(parent) for parent in parents.split(',') if parent}
    return InferenceNode(number, clause, rule, parents)

import { isInterpolationNode, ExpressionNode } from "../ast";

import { TransformPlugin } from "../transform";

export const transformExpression: TransformPlugin = node => {
	if (isInterpolationNode(node)) {
		node.content = processExpression(node.content);
	}
};

function processExpression(node: ExpressionNode) {
	node.content = "_ctx." + node.content;
	return node;
}

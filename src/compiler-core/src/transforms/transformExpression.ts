import { isInterpolationNode } from "../ast";
import { ExpressionNode } from "../parse";
import { TransformPlugin } from "../transform";

export const transformExpression: TransformPlugin = node => {
	if (isInterpolationNode(node)) {
		node.content = precessExpression(node.content);
	}
};

function precessExpression(node: ExpressionNode) {
	node.content = "_ctx." + node.content;
	return node;
}

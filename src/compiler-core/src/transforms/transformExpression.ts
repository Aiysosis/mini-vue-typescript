import { isInterpolationNode } from "../ast";
import { TransformPlugin } from "../transform";

export const transformExpression: TransformPlugin = node => {
	if (isInterpolationNode(node)) {
		const rawContent = node.content.content;
		node.content.content = "_ctx." + rawContent;
	}
};

import { isElementNode, isInterpolationNode, isTextNode } from "../ast";
import {
	ASTNode,
	CompoundExpressionNode,
	InterPolationNode,
	TextNode,
} from "../parse";
import { TransformPlugin } from "../transform";

export const transformText: TransformPlugin = node => {
	const isText = (node: ASTNode): node is TextNode | InterPolationNode =>
		isTextNode(node) || isInterpolationNode(node);

	let compoundNode: CompoundExpressionNode;

	if (isElementNode(node)) {
		const { children } = node;
		for (let i = 0; i < children.length - 1; i++) {
			const child = children[i];
			if (isText(child)) {
				for (let j = i + 1; j < children.length; j++) {
					const nextChild = children[j];
					if (isText(nextChild)) {
						if (!compoundNode)
							children[i] = compoundNode =
								new CompoundExpressionNode(child);
						compoundNode.push(" + ");
						compoundNode.push(nextChild);
						children.splice(j, 1);
						j--;
					} else {
						compoundNode = undefined;
						break;
					}
				}
			}
		}
	}
};

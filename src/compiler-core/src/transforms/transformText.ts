import {
	ASTNode,
	CompoundExpressionNode,
	InterPolationNode,
	TextNode,
	isElementNode,
	isInterpolationNode,
	isTextNode,
	isText,
	createCompoundExpressionNode,
} from "../ast";
import { TransformPlugin } from "../transform";

export const transformText: TransformPlugin = node => {
	let compoundNode: CompoundExpressionNode;

	if (isElementNode(node)) {
		const { children } = node;
		for (let i = 0; i < children.length - 1; i++) {
			const child = children[i];
			if (isText(child)) {
				for (let j = i + 1; j < children.length; j++) {
					const nextChild = children[j];
					if (isText(nextChild)) {
						if (!compoundNode) {
							compoundNode = children[i] =
								createCompoundExpressionNode(child);
						}
						compoundNode.children.push(" + ");
						compoundNode.children.push(nextChild);
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

import {
	CompoundExpressionNode,
	isElementNode,
	isText,
	createCompoundExpressionNode,
} from "../ast";
import { TransformPlugin } from "../transform";

//? 把相邻的 text节点和 interpolation节点合并成新的复合节点，这样有利于更好地渲染
export const transformText: TransformPlugin = node => {
	return () => {
		//* 放入回调函数，从下层往上执行
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
};

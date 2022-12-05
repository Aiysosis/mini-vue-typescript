import { isElementNode, isTextNode } from "./ast";
import { ASTNode, ASTRoot, ElementNode } from "./parse";

export type TransformPlugin = (node: ASTNode) => void;

export type TransformOptions = {
	nodeTransforms?: TransformPlugin[];
};

export type TransformContext = {
	root: ASTRoot;
	nodeTransforms: TransformPlugin[];
};

export function transform(root: ASTRoot, options?: TransformOptions) {
	const context = createTransformContext(root, options);
	//*DFS
	traverseNode(root, context);
}

function createTransformContext(
	root: ASTRoot,
	options: TransformOptions
): TransformContext {
	const context = {
		root,
		nodeTransforms: options.nodeTransforms || [],
	};
	return context;
}

function traverseNode(node: ASTRoot | ElementNode, context: TransformContext) {
	const transforms = context.nodeTransforms;
	for (const child of node.children) {
		if (isElementNode(child)) {
			traverseNode(child, context);
		}
		for (const fn of transforms) {
			fn(child);
		}
	}
}

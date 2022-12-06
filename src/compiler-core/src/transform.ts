import { isElementNode, isInterpolationNode, isTextNode } from "./ast";
import { ASTNode, ASTRoot, ElementNode } from "./parse";

export type TransformPlugin = (node: ASTNode) => void;

export type TransformOptions = {
	nodeTransforms?: TransformPlugin[];
};

export type TransformContext = {
	root: ASTRoot;
	nodeTransforms: TransformPlugin[];
	helpers: Map<string, boolean>;
	helper: (name: string) => void;
};

export function transform(root: ASTRoot, options?: TransformOptions) {
	const context = createTransformContext(root, options);
	//*DFS
	traverseNode(root, context);

	createRootCodegen(root);

	root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: ASTRoot) {
	root.codegenNode = root.children[0];
}

function createTransformContext(
	root: ASTRoot,
	options: TransformOptions
): TransformContext {
	const context: TransformContext = {
		root,
		nodeTransforms: options?.nodeTransforms || [],
		helpers: new Map(),
		helper(name) {
			context.helpers.set(name, true);
		},
	};
	return context;
}

function traverseNode(node: ASTRoot | ElementNode, context: TransformContext) {
	const transforms = context.nodeTransforms;
	for (const child of node.children) {
		if (isElementNode(child)) {
			traverseNode(child, context);
		} else if (isTextNode(child)) {
		} else if (isInterpolationNode(child)) {
			context.helper("toDisplayString");
		}

		for (const fn of transforms) {
			fn(child);
		}
	}
}

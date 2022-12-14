import {
	isElementNode,
	isInterpolationNode,
	isRootNode,
	isTextNode,
} from "./ast";
import { ASTNode, ASTRoot, ElementNode } from "./ast";
import {
	CREATE_ELEMENT_BLOCK,
	helperMapName,
	OPEN_BLOCK,
	TO_DISPLAY_STRING,
} from "./runtimeHelpers";

export type TransformPlugin = (node: ASTNode) => void;

export type TransformOptions = {
	nodeTransforms?: TransformPlugin[];
};

export type TransformContext = {
	root: ASTRoot;
	nodeTransforms: TransformPlugin[];
	helpers: Map<symbol, boolean>;
	helper: (name: symbol[]) => void;
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
		helper(names) {
			for (const name of names) {
				context.helpers.set(name, true);
			}
		},
	};
	return context;
}

function traverseNode(node: ASTRoot | ElementNode, context: TransformContext) {
	const transforms = context.nodeTransforms;
	for (const child of node.children) {
		if (isRootNode(child)) {
			traverseNode(child, context);
		} else if (isElementNode(child)) {
			traverseNode(child, context);
			context.helper([OPEN_BLOCK, CREATE_ELEMENT_BLOCK]);
		} else if (isTextNode(child)) {
		} else if (isInterpolationNode(child)) {
			context.helper([TO_DISPLAY_STRING]);
		}

		for (const fn of transforms) {
			fn(child);
		}
	}
}

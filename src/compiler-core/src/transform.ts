import {
	isElementNode,
	isInterpolationNode,
	isRootNode,
	isTextNode,
} from "./ast";
import { ASTNode, ASTRoot, ElementNode } from "./ast";
import {
	CREATE_ELEMENT_BLOCK,
	OPEN_BLOCK,
	TO_DISPLAY_STRING,
} from "./runtimeHelpers";

export type ExitFn = () => void;

export type TransformPlugin = (
	ast: ASTNode,
	context: TransformContext
) => ExitFn | void;

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
	//* transformElement -> 获取到了codegenNode

	createRootCodegen(root);

	root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: ASTRoot) {
	const child = root.children[0]; //目前只考虑单个根的ast树
	if (isElementNode(child)) {
		//?这样就把 transform 中生成的 codegenNode 赋值到root内部了，然后就可以通过context进行全局的访问了
		root.codegenNode = child.codegenNode;
	} else {
		root.codegenNode = child;
	}
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
	const exitFns: ExitFn[] = [];

	for (const child of node.children) {
		if (isRootNode(child)) {
			traverseNode(child, context);
		} else if (isElementNode(child)) {
			traverseNode(child, context);
		} else if (isTextNode(child)) {
		} else if (isInterpolationNode(child)) {
			context.helper([TO_DISPLAY_STRING]);
		}

		//* transform的插件的顺序必须是类似后序遍历的顺序，即先转换子节点，再转换父节点
		//* 具体实现为：设置一个堆栈，记录回调函数，然后从栈顶执行，context保存在闭包内
		//! 同时，由于引入的这样的机制，对于同一个节点的转换，会先执行后面的处理函数，如 nodetransforms = [fn1,fn2];
		//! 会先执行 fn2,再执行 fn1
		//! 更加复杂的情况，对于某个transform插件，前一部分是同步执行的逻辑 A，然后返回一个exitFn B,另一个插件类似有同步逻辑 C,返回函数 D，
		//! 那么执行的顺序为 A->C->D->B
		for (const fn of transforms) {
			const onExit = fn(child, context);
			if (onExit) {
				exitFns.push(onExit);
			}
		}
	}

	for (let i = exitFns.length - 1; i >= 0; i--) {
		const exitFn = exitFns[i];
		exitFn();
	}
}

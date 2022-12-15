import { isArray, isString } from "@/shared";
import {
	ASTNode,
	ASTRoot,
	CompoundExpressionNode,
	ElementNode,
	ExpressionNode,
	InterPolationNode,
	NodeTypes,
	TextNode,
	VNodeCall,
} from "./ast";
import {
	CREATE_ELEMENT_BLOCK,
	helperMapName,
	OPEN_BLOCK,
	TO_DISPLAY_STRING,
} from "./runtimeHelpers";

export type CodegenContext = {
	code: string;
	push: (source: string) => void;
	newLine: (n?: number) => void;
	helper: (key: symbol) => string;
	tab: (n?: number) => void;
};

//* 在transform之后，codegenNode 已经产生
export function codegen(ast: ASTRoot) {
	const context = createCodegenContext();

	genFunctionPreamble(context, ast);

	genFunctionBody(context, ast);

	return {
		code: context.code,
	};
}

function genFunctionBody(context: CodegenContext, ast: ASTRoot) {
	const { push, newLine } = context;
	let functionName = "render";
	let args = ["_ctx", " _cache", "$props", "$setup", "$data", "$options"];
	const signature = args.join(", ");
	push(`export function ${functionName}(${signature}) {\n`);
	push("\treturn (");
	//! 注意，这里传入的是 codegenNode
	genNode(context, ast.codegenNode);
	push(")");
	newLine();
	push("}");
}

function genFunctionPreamble(context: CodegenContext, ast: ASTRoot) {
	const { push, newLine } = context;
	const VueBinging = "vue";
	// const helpers = ["toDisplayString"]; now recorded in ast object
	const aliasHelpers = (s: symbol) =>
		`${helperMapName[s]} as _${helperMapName[s]}`;
	if (ast.helpers.length > 0)
		push(
			`import { ${ast.helpers
				.map(aliasHelpers)
				.join(", ")} } from "${VueBinging}"`
		);
	newLine(2);
}

function genNode(context: CodegenContext, node: ASTNode) {
	switch (node.type) {
		case NodeTypes.ELEMENT:
			//? 所有的 element 经过 transform的处理，都变成了 VNodeCall节点，进到这里说明transform出错了
			if (!(node as ElementNode).codegenNode)
				throw new Error("[Codegen error]: transform failed");
			genNode(context, (node as ElementNode).codegenNode);
			break;
		case NodeTypes.VNODE_CALL:
			//? element 节点走这里
			genVNodeCall(context, node as VNodeCall);
			break;
		case NodeTypes.TEXT:
			genText(context, node as TextNode);
			break;
		case NodeTypes.INTERPOLATION:
			genInterpolation(context, node as InterPolationNode);
			break;
		case NodeTypes.SIMPLE_EXPRESSION:
			genExpression(context, node as ExpressionNode);
			break;
		case NodeTypes.COMPOUND_EXPRESSION:
			genCompoundExpressionNode(context, node as CompoundExpressionNode);
			break;
		default:
			break;
	}
}

function genVNodeCall(context: CodegenContext, node: VNodeCall) {
	const { push, helper } = context;
	const { tag, children, props } = node;
	// push(helper(OPEN_BLOCK));
	// push(", ");
	push(helper(CREATE_ELEMENT_BLOCK));
	//! 这里有一个比较麻烦的处理点：如果没有props，也没有children，那么函数只保留第一个参数即可，而如果有children，那么props的
	//! 位置必须要用 null来占住，这是函数传参所决定的，所以要干两件事：
	//* 1. 按照children,props,tag的顺序（从后往前）遍历，遇到null就置空，否则 break -> genNullableArgs
	//* 2. 把处理完毕的这三个参数继续处理即可 -> genNodeList
	//? 当然，目前情况下我们默认tag是不会为空的
	// push(`("${tag}", null, `);
	push("(");
	const nullableArgs = [`"${tag}"`, props, children];
	genNodeList(genNullableArgs(nullableArgs), context);
	push(")");
}

function genNullableArgs(args: any[]): any[] {
	let i = args.length;
	while (i--) {
		if (args[i] != null) break;
	}
	return args.slice(0, i + 1).map(arg => arg || `null`);
}

function genNodeList(nodes: any[], context: CodegenContext) {
	const { push } = context;
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (isString(node)) {
			push(node);
		} else {
			if (isArray(node)) {
				push("[");
				for (let i = 0; i < node.length; i++) {
					const child = node[i];
					genNode(context, child);
					if (i < node.length - 1) push(", ");
				}
				push("]");
			} else {
				genNode(context, node);
			}
		}

		if (i < nodes.length - 1) {
			push(", ");
		}
	}
}

function genCompoundExpressionNode(
	context: CodegenContext,
	node: CompoundExpressionNode
) {
	const { push } = context;
	for (const child of node.children) {
		if (isString(child)) {
			push(child);
		} else {
			genNode(context, child);
		}
	}
}

function genText(context: CodegenContext, node: TextNode) {
	const { push } = context;
	push(`"${node.content}"`);
}

function genInterpolation(context: CodegenContext, node: InterPolationNode) {
	const { push, helper } = context;
	push(helper(TO_DISPLAY_STRING));
	push("(");
	genNode(context, node.content);
	push(")");
}

function genExpression(context: CodegenContext, node: ExpressionNode) {
	const { push } = context;
	push(node.content);
}

function createCodegenContext(): CodegenContext {
	const context: CodegenContext = {
		code: "",
		push(source: string) {
			context.code += source;
		},
		helper(key) {
			return `_${helperMapName[key]}`;
		},
		newLine(n = 1) {
			context.push("\n".repeat(n));
		},
		tab(n = 1) {
			context.push("\t".repeat(n));
		},
	};
	return context;
}

import { isExpressionNode, isInterpolationNode, isTextNode } from "./ast";
import {
	ASTNode,
	ASTRoot,
	ExpressionNode,
	InterPolationNode,
	TextNode,
} from "./parse";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

export type CodegenContext = {
	code: string;
	push: (source: string) => void;
	helper: (key: symbol) => string;
};

export function codegen(ast: ASTRoot) {
	const context = createCodegenContext();

	const { push } = context;

	genFunctionPreamble(context, ast);

	push("export ");
	let functionName = "render";
	let args = ["_ctx", " _cache", "$props", "$setup", "$data", "$options"];
	const signature = args.join(", ");
	push(`function ${functionName}(${signature}){\n`);
	push("\treturn ");
	genNode(context, ast.codegenNode);
	push("\n");
	push("}");

	return {
		code: context.code,
	};
}
function genFunctionPreamble(context: CodegenContext, ast: ASTRoot) {
	const { push } = context;
	const VueBinging = "vue";
	// const helpers = ["toDisplayString"]; now recorded in ast object
	const aliasHelpers = (s: symbol) =>
		`${helperMapName[s]} as _${helperMapName[s]}`;
	if (ast.helpers.length > 0)
		push(
			`import { ${ast.helpers.map(aliasHelpers)} } from "${VueBinging}"`
		);
	push("\n");
}

function genNode(context: CodegenContext, node: ASTNode) {
	const { push } = context;
	if (isTextNode(node)) {
		genText(context, node);
	} else if (isInterpolationNode(node)) {
		genInterpolation(context, node);
	} else if (isExpressionNode(node)) {
		genExpression(context, node);
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
	};
	return context;
}

import { isExpressionNode, isInterpolationNode, isTextNode } from "./ast";
import {
	ASTNode,
	ASTRoot,
	ExpressionNode,
	InterPolationNode,
	TextNode,
} from "./parse";

export type CodegenContext = {
	code: string;
	push: (source: string) => void;
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
	const aliasHelpers = (s: string) => `${s} as _${s}`;
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
	const { push } = context;
	push("_toDisplayString(");
	genNode(context, node.content);
	push(")");
}

function genExpression(context: CodegenContext, node: ExpressionNode) {
	const { push } = context;
	push(node.content);
}

function createCodegenContext(): CodegenContext {
	const context = {
		code: "",
		push(source: string) {
			context.code += source;
		},
	};
	return context;
}

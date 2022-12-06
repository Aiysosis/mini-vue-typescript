import { isString } from "@/shared";
import {
	isCompoundExpressionNode,
	isElementNode,
	isInterpolationNode,
	isSimpleExpressionNode,
	isTextNode,
	NodeTypes,
} from "./ast";
import {
	ASTNode,
	ASTRoot,
	CompoundExpressionNode,
	ElementNode,
	ExpressionNode,
	InterPolationNode,
	TextNode,
} from "./parse";
import {
	CREATE_ELEMENT_BLOCK,
	helperMapName,
	OPEN_BLOCK,
	TO_DISPLAY_STRING,
} from "./runtimeHelpers";

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
	switch (node.type) {
		case NodeTypes.ELEMENT:
			genElement(context, node as ElementNode);
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

function genElement(context: CodegenContext, node: ElementNode) {
	const { push, helper } = context;
	push("(");
	push(helper(OPEN_BLOCK));
	push(", ");
	push(helper(CREATE_ELEMENT_BLOCK));
	push(`("${node.tag}"), null, `);

	for (const child of node.children) {
		console.log("gen child: ", child);
		genNode(context, child);
	}

	push(")");
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

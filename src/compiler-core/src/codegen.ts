import { isTextNode } from "./ast";
import { ASTNode, ASTRoot } from "./parse";

export type CodegenContext = {
	code: string;
	push: (source: string) => void;
};

export function codegen(ast: ASTRoot) {
	const context = createCodegenContext();

	const { push } = context;

	const VueBinging = "vue";
	const helpers = ["toDisplayString"];
	const aliasHelpers = (s: string) => `${s} as _${s}`;
	push(`import { ${helpers.map(aliasHelpers)} } from "${VueBinging}"`);
	push("\n");

	push("export ");
	let functionName = "render";
	let args = ["_ctx", " _cache", "$props", "$setup", "$data", "$options"];
	const signature = args.join(", ");
	push(`function ${functionName}(${signature}){\n`);
	push("\treturn ");
	push("\n");
	genNode(ast.codegenNode, context);
	push("}");

	return {
		code: context.code,
	};
}
function genNode(node: ASTNode, context: CodegenContext) {
	const { push } = context;
	if (isTextNode(node)) {
		push(`"${node.content}"`);
	}
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

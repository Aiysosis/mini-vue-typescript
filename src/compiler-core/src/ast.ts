import { Props } from "@/runtime-core/vnode";

export enum NodeTypes {
	ROOT,
	TEXT,
	ELEMENT,
	INTERPOLATION,
	SIMPLE_EXPRESSION,
	COMPOUND_EXPRESSION,

	//code_gen
	VNODE_CALL,
}

export interface ASTNode {
	type: NodeTypes;
}

export interface ASTRoot extends ASTNode {
	codegenNode: ASTNode;
	helpers: symbol[];
	children: ASTNode[];
}

export interface ElementNode extends ASTNode {
	tag: string;
	children: ASTNode[];
	codegenNode: VNodeCall;
}

export interface TextNode extends ASTNode {
	content: string;
}

export interface ExpressionNode extends ASTNode {
	content: string;
}

export interface InterPolationNode extends ASTNode {
	content: ExpressionNode;
}

export type CompoundExpressionChild = string | TextNode | InterPolationNode;

export interface CompoundExpressionNode extends ASTNode {
	children: CompoundExpressionChild[];
}

export interface VNodeCall extends ASTNode {
	tag: string;
	props: Props;
	children: ASTNode;
}

export function createCompoundExpressionNode(
	node: TextNode | InterPolationNode
): CompoundExpressionNode {
	return {
		type: NodeTypes.COMPOUND_EXPRESSION,
		children: [node],
	};
}

export const isRootNode = (node: ASTNode): node is ASTRoot =>
	node.type === NodeTypes.ROOT;

export const isElementNode = (node: ASTNode): node is ElementNode =>
	node.type === NodeTypes.ELEMENT;

export const isTextNode = (node: ASTNode): node is TextNode =>
	node.type === NodeTypes.TEXT;

export const isInterpolationNode = (node: ASTNode): node is InterPolationNode =>
	node.type === NodeTypes.INTERPOLATION;

export const isSimpleExpressionNode = (node: ASTNode): node is ExpressionNode =>
	node.type === NodeTypes.SIMPLE_EXPRESSION;

export const isCompoundExpressionNode = (
	node: ASTNode
): node is CompoundExpressionNode =>
	node.type === NodeTypes.COMPOUND_EXPRESSION;

export const isText = (node: ASTNode): node is TextNode | InterPolationNode =>
	isTextNode(node) || isInterpolationNode(node);

import {
	ASTNode,
	ElementNode,
	ExpressionNode,
	InterPolationNode,
	TextNode,
} from "./parse";

export enum NodeTypes {
	INTERPOLATION,
	SIMPLE_EXPRESSION,
	ELEMENT,
	TEXT,
	ROOT,
}

export const isElementNode = (node: ASTNode): node is ElementNode =>
	node.type === NodeTypes.ELEMENT;

export const isTextNode = (node: ASTNode): node is TextNode =>
	node.type === NodeTypes.TEXT;

export const isInterpolationNode = (node: ASTNode): node is InterPolationNode =>
	node.type === NodeTypes.INTERPOLATION;

export const isExpressionNode = (node: ASTNode): node is ExpressionNode =>
	node.type === NodeTypes.SIMPLE_EXPRESSION;

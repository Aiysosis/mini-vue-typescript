import { NodeTypes } from "./ast";

const enum TagType {
	START,
	END,
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

export class CompoundExpressionNode implements ASTNode {
	children: CompoundExpressionChild[];
	type = NodeTypes.COMPOUND_EXPRESSION;
	constructor(val?: CompoundExpressionChild) {
		this.children = [val];
	}
	push(this: CompoundExpressionNode, val: CompoundExpressionChild) {
		this.children.push(val);
	}
}

type ParseContext = {
	source: string;
};

export function baseParse(content: string) {
	const context = createParserContext(content);
	//* 解析的过程是从头到尾逐步推进的，所以需要解析一部分然后就剪掉，这样解析的过程才是可持续的。
	//* 而判断用什么方法进行解析，则是根据当前待解析字符串的头部元素进行判断，如如果发现字符串头部为 {{，
	//* 说明接下来是插值，那么就调用相应的函数进行解析。同时，用于步进剪切的函数可以抽离出来，这样各种类型的解析都可以复用

	return createRoot(parseChildren(context, []));
}

//@fn parseChildren
function parseChildren(context: ParseContext, ancesters: ElementNode[]) {
	const nodes: ASTNode[] = [];

	while (!isEnd(context, ancesters)) {
		let node = null;
		const s = context.source;

		if (s.startsWith("{{")) {
			node = parseInterpolation(context);
		} else if (s[0] == "<") {
			if (/[a-zA-Z]/.test(s[1])) {
				node = parseElement(context, ancesters);
			}
		}

		if (!node) {
			node = parseText(context);
		}

		nodes.push(node);
	}
	return nodes;
}

function isEnd(context: ParseContext, ancesters: ElementNode[]) {
	let s = context.source;
	if (s.startsWith("</")) {
		//? 为什么要遍历而不是直接检查栈顶？ 因为标签不一定是完全匹配的，因此要使用更健壮的检查策略，否则在出问题时会陷入死循环
		for (const el of ancesters) {
			if (s.slice(2, 2 + el.tag.length) === el.tag) return true;
		}
	}
	return !s;
}

//@fn parseText
function parseText(context: ParseContext): TextNode {
	let s = context.source;

	let endIndex = s.length;
	let endTokens = ["{{", "<"];
	let index = -1;
	for (const token of endTokens) {
		index = s.indexOf(token);
		if (index !== -1) {
			endIndex = Math.min(endIndex, index);
		}
	}

	const content = parseTextData(context, endIndex);

	return {
		type: NodeTypes.TEXT,
		content,
	};
}

//@fn parseTextData
function parseTextData(context: ParseContext, length: number) {
	const content = context.source.slice(0, length);
	advanceBy(context, length);
	return content;
}

//@fn parseElement
function parseElement(
	context: ParseContext,
	ancesters: ElementNode[]
): ElementNode {
	//? 思路，先提取出tag内容，然后进行 括号匹配？找到相应的闭合标签
	const element = parseTag(context, TagType.START);

	ancesters.push(element);
	element.children = parseChildren(context, ancesters);
	ancesters.pop();

	if (context.source.slice(2, 2 + element.tag.length) === element.tag) {
		parseTag(context, TagType.END);
	} else {
		throw new Error(element.tag + " lack end tag");
	}

	return element;
}

//@fn parseTag
function parseTag(context: ParseContext, type: TagType): ElementNode {
	const match = /^<\/?([a-z]+)/i.exec(context.source);
	let tag: string;
	if (match) {
		tag = match[1];
		advanceBy(context, match[0].length + 1);
	}

	if (type === TagType.END) return;

	return {
		type: NodeTypes.ELEMENT,
		tag,
		children: [],
	};
}

//@fn parseInterpolation
function parseInterpolation(context: ParseContext): InterPolationNode {
	//todo 解析插值
	//? {{exp}} -> exp
	const openDelimeter = "{{";
	const closeDelimeter = "}}";

	const closeIdx = context.source.indexOf(
		closeDelimeter,
		openDelimeter.length
	);

	advanceBy(context, openDelimeter.length); //舍弃前两位的 {{

	const contentLength = closeIdx - openDelimeter.length;
	const rawContent = parseTextData(context, contentLength);
	const content = rawContent.trim();

	advanceBy(context, closeDelimeter.length);

	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content,
		},
	};
}

function advanceBy(context: ParseContext, start: number) {
	context.source = context.source.slice(start);
}

function createRoot(children: ASTNode[]): ASTRoot {
	return {
		type: NodeTypes.ROOT,
		codegenNode: null,
		helpers: [],
		children,
	};
}

function createParserContext(content: string): ParseContext {
	return {
		source: content,
	};
}

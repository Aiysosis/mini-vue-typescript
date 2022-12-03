import { NodeTypes } from "./ast";

const enum TagType {
	START,
	END,
}

type ParseContext = {
	source: string;
};

export function baseParse(content: string) {
	const context = createParserContext(content);
	//* 解析的过程是从头到尾逐步推进的，所以需要解析一部分然后就剪掉，这样解析的过程才是可持续的。
	//* 而判断用什么方法进行解析，则是根据当前待解析字符串的头部元素进行判断，如如果发现字符串头部为 {{，
	//* 说明接下来是插值，那么就调用相应的函数进行解析。同时，用于步进剪切的函数可以抽离出来，这样各种类型的解析都可以复用

	return createRoot(parseChildren(context));
}

function parseChildren(context: ParseContext) {
	const nodes = [];

	let node = null;
	const s = context.source;

	if (s.startsWith("{{")) {
		node = parseInterpolation(context);
	} else if (s[0] == "<") {
		if (/[a-zA-Z]/.test(s[1])) {
			node = parseElement(context);
		}
	}

	if (!node) {
		node = parseText(context);
	}

	nodes.push(node);

	return nodes;
}

function parseText(context: ParseContext) {
	const content = parseTextData(context, context.source.length);

	return {
		type: NodeTypes.TEXT,
		content,
	};
}

function parseTextData(context: ParseContext, length: number) {
	const content = context.source.slice(0, length);
	advanceBy(context, length);
	return content;
}

function parseElement(context: ParseContext): any {
	//? 思路，先提取出tag内容，然后进行 括号匹配？找到相应的闭合标签
	const element = parseTag(context, TagType.START);
	console.log("source: ", context.source);

	parseTag(context, TagType.END);
	console.log("source: ", context.source);

	return element;
}

function parseTag(context: ParseContext, type: TagType) {
	const match = /^<\/?([a-z]+)/i.exec(context.source);
	let tag: string;
	if (match) {
		console.log(match);
		tag = match[1];
		advanceBy(context, match[0].length + 1);
	}

	if (type === TagType.END) return;

	return {
		type: NodeTypes.ELEMENT,
		tag,
	};
}

function parseInterpolation(context: ParseContext) {
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

function createRoot(children: any[]) {
	return {
		children,
	};
}

function createParserContext(content: string): ParseContext {
	return {
		source: content,
	};
}

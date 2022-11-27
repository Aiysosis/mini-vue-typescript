import { Component } from "@/runtime-core/component";
import {
	createRenderer,
	RendererNode,
	RendererOptions,
} from "@/runtime-core/renderer";

type DomElement = Element;
type DomNode = RendererNode;
const domInterfaceImplement: RendererOptions<DomNode, DomElement> = {
	patchProp(el, key, prevValue, nextValue) {},
	insert(el, parent, anchor?) {
		parent.appendChild(el as Node);
	},
	remove(el) {},
	createElement(type) {
		return document.createElement(type);
	},
	createText(text) {
		return document.createTextNode(text);
	},
	setText(node, text) {},
	setElementText(node, text) {
		node.textContent = text;
	},
};

export const renderer = createRenderer(domInterfaceImplement);

export function createApp(app: Component) {
	return renderer.createApp(app);
}

export * from "../runtime-core/index";

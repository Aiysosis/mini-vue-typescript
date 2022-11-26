import { isArray, isObject, isString } from "@/shared/index";
import { ShapeFlags } from "@/shared/shapeFlags";
import { Component } from "./component";
import { RawSlots } from "./componentSlots";
import { RendererElement } from "./renderer";

export type VNodeChildren = string | VNode[] | RawSlots | null;

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export interface VNode {
	type: string | Component | Symbol;
	el: RendererElement;
	props: Props | null;
	children: VNodeChildren;
	shapeFlag: number;
}

export type Props = {
	[key: string]: string | Function | Function[];
};

export function createVNode(
	type: string | Component | Symbol,
	props: Props | null = null,
	children: VNodeChildren = null
): VNode {
	//todo createVNode
	const vnode = {
		type,
		props,
		children,
		el: null,
		shapeFlag: initShapeFlag(type),
	};

	if (children) {
		vnode.shapeFlag |= isString(children)
			? ShapeFlags.TEXT_CHILDREN
			: isArray(children)
			? ShapeFlags.ARRAY_CHILDREN
			: isObject(children)
			? ShapeFlags.SLOTS_CHILDREN
			: 0;
	}

	return vnode;
}

function initShapeFlag(type: any) {
	if (typeof type === "string") {
		return ShapeFlags.ELEMENT;
	} else {
		return ShapeFlags.STATEFUL_COMPONENT;
	}
}

export const h = createVNode;

export function createTextVNode(text: string) {
	return createVNode(Text, {}, text);
}

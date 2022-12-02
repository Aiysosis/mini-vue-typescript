import { isArray, isObject, isString } from "@/shared/index";
import { ShapeFlags } from "@/shared/shapeFlags";
import { Component, ComponentInstance } from "./component";
import { RawSlots } from "./componentSlots";
import { RendererElement } from "./renderer";

export type VNodeChildren = string | VNode[] | RawSlots | null;

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export interface VNode {
	type: string | Component | Symbol;
	el: RendererElement; //? el 是该 vnode被渲染后的元素 set->mountElement
	props: Props | null;
	children: VNodeChildren;
	shapeFlag: number;
	component: ComponentInstance;
	key?: string;
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
		key: props?.key as string,
		children,
		el: null,
		component: null,
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

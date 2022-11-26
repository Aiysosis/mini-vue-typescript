import { isArray, isObject, isString } from "@/shared/index";
import { ShapeFlags } from "@/shared/shapeFlags";
import { Component } from "./component";
import { Slots } from "./componentSlots";
import { RendererElement } from "./renderer";

export type VNodeChildren = string | VNode[] | Slots | null;

export interface VNode {
	type: string | Component;
	el: RendererElement;
	props: Props | null;
	children: VNodeChildren;
	shapeFlag: number;
}

export type Props = {
	[key: string]: string | Function | Function[];
};

export function createVNode(
	type: string | Component,
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

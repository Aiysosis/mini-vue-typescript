import { ShapeFlags } from "@/shared/shapeFlags";
import { Component } from "./component";
import { RendererElement } from "./renderer";

export interface VNode {
	type: string | Component;
	el: RendererElement;
	props?: Props;
	children: string | VNode[];
	shapeFlag: number;
}

type Props = {
	[key: string]: string | Function | Function[];
};

export function createVNode(
	type: string | Component,
	props?: Props,
	children?: string | VNode[]
): VNode {
	//todo createVNode
	const vnode = {
		type,
		props,
		children,
		el: null,
		shapeFlag: initShapeFlag(type),
	};
	if (typeof children === "string") {
		vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
	} else {
		vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
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

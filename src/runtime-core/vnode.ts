import { Component } from "./component";
import { RendererElement } from "./renderer";

export interface VNode {
	type: string | Component;
	el: RendererElement;
	props?: Props;
	children: string | VNode[];
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
	};
	return vnode;
}

export const h = createVNode;

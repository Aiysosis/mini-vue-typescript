import { Component } from "./component";

export interface VNode {
	type: string | Component;
	props?: Props;
	children: string | VNode[];
}

type Props = {
	[key: string]: string;
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
	};
	return vnode;
}

export const h = createVNode;

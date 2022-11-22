export interface VNode {
	type: string;
	props?: {
		[key: string]: string;
	};
	children: string | VNode[];
}

export function createVNode(type, props?, children?) {
	//todo createVNode
	const vnode = {
		type,
		props,
		children,
	};
	return vnode;
}

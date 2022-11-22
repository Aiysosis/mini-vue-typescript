import { Component } from "./component";
import { renderer, RendererElement } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(app: Component) {
	//todo createApp
	return {
		mount: (rootContainer: RendererElement) => {
			//* 基于组件创建虚拟节点
			const vnode = createVNode(app);

			//* 进行渲染操作
			renderer.render(vnode, rootContainer);
		},
	};
}

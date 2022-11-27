import { Component } from "./component";
import { RendererElement, RenderFn } from "./renderer";
import { createVNode } from "./vnode";

export function createAppAPI(render: RenderFn) {
	return function createApp(app: Component) {
		return {
			mount: (rootContainer: RendererElement) => {
				//* 基于组件创建虚拟节点
				const vnode = createVNode(app);

				//* 进行渲染操作
				render(vnode, rootContainer);
			},
		};
	};
}

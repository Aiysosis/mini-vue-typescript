import {
	ComponentInstance,
	createComponentInstance,
	setupComponent,
} from "./component";
import { VNode } from "./vnode";

export interface RendererNode {
	[key: string]: any;
}

export interface RendererElement extends RendererNode {}

function createRenderer() {
	function patch(n1: VNode | null, n2: VNode, container: RendererElement) {
		//todo 不止组件
		//? 只实现主流程
		//? n1=null n2=vnode n2.type=component container=rootContainer
		console.log(container);
		if (typeof n2.type === "object") {
			// 经过判断新旧节点都是组件
			processComponent(n1, n2, container);
		}
	}
	function processComponent(
		n1: VNode | null,
		n2: VNode,
		container: RendererElement
	) {
		if (!n1) {
			mountComponent(n2, container);
		} else {
			// patchComponent(n1, n2, container);
		}
	}
	// 组件挂载
	function mountComponent(vnode: VNode, container: RendererElement) {
		const instance = createComponentInstance(vnode);

		// 这一步初始化了Props，slots，setup函数，
		// instance 多了两个属性：setupState(setup函数的返回值),render(组件的 render函数)
		setupComponent(instance);

		setupRenderEffect(instance, container);
	}
	function setupRenderEffect(
		instance: ComponentInstance,
		container: RendererElement
	) {
		const subTree = instance.render();
		patch(null, subTree, container);
	}
	function unmount(vnode: VNode) {}

	function render(vnode: VNode, container: RendererElement) {
		if (vnode) {
			//* 有 vnode，进行patch操作
			patch(container._vnode, vnode, container);
		} else {
			//* 没有 vnode，卸载节点
			unmount(vnode);
		}
	}

	return {
		render,
	};
}

export const renderer = createRenderer();

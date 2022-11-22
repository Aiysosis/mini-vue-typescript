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

export type RenderFn = (
	vnode: VNode | null,
	container: RendererElement
) => void;

export type Renderer = {
	render: RenderFn;
};

export type PatchFn = (
	n1: VNode | null, // null means mount
	n2: VNode,
	container: RendererElement
) => void;

export interface Invoker {
	(e: any): void;
	value: Function | Function[];
}

//* 抽离出的平台无关的节点操作逻辑
//* 这里的 元素（HostElement） 和 节点（HostNode）单从类型上来看好像没有任何区别，只是为了逻辑更清晰？
//? 已经渲染的叫元素，未渲染的叫节点？
export interface RendererOptions<
	HostNode = RendererNode,
	HostElement = RendererElement
> {
	//只包含的部分，因为目标是实现一个最精简的核
	patchProp(
		el: HostElement,
		key: string,
		prevValue: any,
		nextValue: any
	): void; //* 处理 prop
	insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void; //* 为某个元素添加子节点
	remove(el: HostNode): void; //*
	createElement(type: string): HostElement;
	createText(text: string): HostNode;
	setText(node: HostNode, text: string): void;
	setElementText(node: HostElement, text: string): void;
}

function createRenderer(options: RendererOptions) {
	const {
		patchProp: hostPatchProp,
		insert: hostInsert,
		remove: hostRemove,
		createElement: hostCreateElement,
		createText: hostCreateText,
		setText: hostSetText,
		setElementText: hostSetElementText,
	} = options;

	const patch: PatchFn = (n1, n2, container) => {
		if (typeof n1.type !== typeof n2.type) {
			unmount(n1);
		}
		//? 只实现主流程
		//? n1=null n2=vnode n2.type=component container=rootContainer
		console.log(container);
		if (typeof n2.type === "object") {
			// 经过判断新旧节点都是组件
			processComponent(n1, n2, container);
		}
	};
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

	const render: RenderFn = (vnode, container) => {
		if (vnode) {
			//* 有 vnode，进行patch操作
			patch(container._vnode, vnode, container);
		} else {
			//* 没有 vnode，卸载节点
			unmount(vnode);
		}
	};

	return {
		render,
	};
}

type DomElement = Element;
type DomNode = RendererNode;
const domInterfaceImplement: RendererOptions<DomNode, DomElement> = {
	patchProp(el, key, prevValue, nextValue) {},
	insert(el, parent, anchor?) {},
	remove(el) {},
	createElement(type) {
		return document.createElement(type);
	},
	createText(text) {
		return {};
	},
	setText(node, text) {},
	setElementText(node, text) {
		node.innerHTML = text;
	},
};

export const renderer = createRenderer(domInterfaceImplement);

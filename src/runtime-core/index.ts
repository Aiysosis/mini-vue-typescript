export { h } from "./vnode";

export { createApp } from "./createApp";

// //! 代码中带有 host前缀的表示平台相关的 类型/方法

// export interface VNode {
// 	type: keyof HTMLElementTagNameMap;
// 	props?: {
// 		[key: string]: string;
// 	};
// 	children: string | VNode[];
// 	el: RendererElement;
// }

// //为什么采用这么宽泛的类型？ 因为面向全平台，
// //所以RendererElement的类型无法确定
// export interface RendererNode {
// 	[key: string]: any;
// }

// export interface RendererElement extends RendererNode {}

// export type RenderFn = (
// 	vnode: VNode | null,
// 	container: RendererElement
// ) => void;

// export type Renderer = {
// 	render: RenderFn;
// };

// export type PatchFn = (
// 	n1: VNode | null, // null means mount
// 	n2: VNode,
// 	container: RendererElement
// ) => void;

// export interface Invoker {
// 	(e: any): void;
// 	value: Function | Function[];
// }

// //* 抽离出的平台无关的节点操作逻辑
// //* 这里的 元素（HostElement） 和 节点（HostNode）单从类型上来看好像没有任何区别，只是为了逻辑更清晰？
// //? 已经渲染的叫元素，未渲染的叫节点？
// //todo 弄清 HostElement 和 HostNode 之间的关系
// export interface RendererOptions<
// 	HostNode = RendererNode,
// 	HostElement = RendererElement
// > {
// 	//只包含的部分，因为目标是实现一个最精简的核
// 	patchProp(
// 		el: HostElement,
// 		key: string,
// 		prevValue: any,
// 		nextValue: any
// 	): void; //* 处理 prop
// 	insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void; //* 为某个元素添加子节点
// 	remove(el: HostNode): void; //*
// 	createElement(type: string): HostElement;
// 	createText(text: string): HostNode;
// 	setText(node: HostNode, text: string): void;
// 	setElementText(node: HostElement, text: string): void;
// }

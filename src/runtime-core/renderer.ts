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

	const shouldSetAsProps = (el: RendererElement, key: string, value: any) => {
		//特殊处理
		if (key === "form" && el.tagName === "input") return false;
		//兜底
		return key in el;
	};

	const patchProps = (
		el: RendererElement & {
			_vei?: Record<string, Invoker | undefined>;
		},
		key: string,
		prevValue: any,
		nextValue: any
	) => {
		//* 分情况讨论
		const type = typeof el[key];

		//? 约定以 on开头的属性都视为事件（onclick,onMouseover...）
		if (/^on/.test(key)) {
			//? 如果直接添加事件，删除事件会很麻烦，可以用一个变量把处理函数记录下来
			const invokers = el._vei || (el._vei = {}); //* vue event invoker
			const eventName = key.slice(2).toLowerCase();
			let invoker = invokers[key];
			if (nextValue) {
				//* nextValue: Function | Function[]
				if (!invoker) {
					//* 缓存
					//invoker 是带有属性value的函数，它的value是缓存的事件处理函数
					invoker = ((e: any) => {
						if (Array.isArray(invoker.value)) {
							for (const fn of invoker.value) {
								fn(e);
							}
						} else {
							invoker.value(e);
						}
					}) as Invoker;

					invoker.value = nextValue;
					//保存
					invokers[key] = invoker;
					el._vei = invokers;
					el.addEventListener(eventName, invoker);
				} else {
					//* 有 invoker 直接更新
					invoker.value = nextValue;
				}
			} else if (invoker) {
				//* 如果没有处理函数，且invoker存在，那么要清空
				el.removeEventListener(eventName, invoker);
			}
		}
		//? class 使用el.className 兼容 + 提速
		else if (key === "class") {
			el.className = nextValue || "";
		} else if (shouldSetAsProps(el, key, nextValue)) {
			//* 要设置的属性是 DOM Properties
			//? 只有属性名的情况 例如 buttn 按钮的 disable
			if (type === "boolean" && nextValue === "") {
				el[key] = true;
			} else {
				//* 一般情形
				el[key] = nextValue;
			}
		} else {
			//* 设置的属性没有对应的 DOM Properties, 使用 setAttribute
			el.setAttribute(key, nextValue);
		}
	};

	function processElement(
		n1: VNode | null,
		n2: VNode,
		container: RendererElement
	) {
		if (!n1) {
			mountElement(n2, container);
		} else {
			//todo update element
		}
	}

	const patch: PatchFn = (n1, n2, container) => {
		//* 两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
		//* 如果新旧的 tagName 不一样，那么直接卸载旧的，然后挂新的上去
		if (n1 && n1.type !== n2.type) {
			unmount(n1);
			n1 = null;
		}

		if (typeof n2.type === "object") {
			processComponent(n1, n2, container);
		} else {
			processElement(n1, n2, container);
		}
	};
	function mountElement(vnode: VNode, container: RendererElement) {
		const el = hostCreateElement(vnode.type as string);
		//* 引用实际的 dom 元素，用于后续的卸载操作
		vnode.el = el;

		//+ 本次流程不会涉及
		// if (vnode.props) {
		// 	for (const key in vnode.props) {
		// 		patchProps(el, key, null, vnode.props[key]);
		// 	}
		// }

		//* process children
		if (typeof vnode.children === "string") {
			//* child is plain text
			// el.innerHTML = vnode.children;
			hostSetElementText(el, vnode.children);
		} else {
			//* child is vnode
			//* 递归调用
			vnode.children.forEach(node => {
				mountElement(node, el);
			});
		}

		//* insert
		hostInsert(el, container);
	}
	function processComponent(
		n1: VNode | null,
		n2: VNode,
		container: RendererElement
	) {
		if (!n1) {
			mountComponent(n2, container);
		} else {
			//+ 本次流程不会涉及
			// patchComponent(n1, n2, container);
		}
	}
	// 组件挂载
	function mountComponent(vnode: VNode, container: RendererElement) {
		const instance = createComponentInstance(vnode);

		//+ 这一步初始化了Props，slots，setup函数，
		//+ instance 多了两个属性：setupState(setup函数的返回值),render(组件的 render函数)
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
	function unmount(vnode: VNode) {
		//todo 调用声明周期函数 or 钩子函数
	}

	const render: RenderFn = (vnode, container) => {
		if (vnode) {
			//* 有 vnode，进行patch操作
			patch(container._vnode || null, vnode, container);
		} else {
			//* 没有 vnode，卸载节点
			unmount(container._vnode);
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
	insert(el, parent, anchor?) {
		parent.appendChild(el as Node);
	},
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

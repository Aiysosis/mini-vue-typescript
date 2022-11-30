import { effect } from "@/reactivity/effect";
import { EMPTY_OBJ, isObject } from "@/shared/index";
import { ShapeFlags } from "@/shared/shapeFlags";

import {
	ComponentInstance,
	createComponentInstance,
	Data,
	setupComponent,
} from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, VNode, Text, Props } from "./vnode";

//+ 这种定义方式兼容了 null
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
	container: RendererElement,
	anchor?: RendererNode
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

export function createRenderer(options: RendererOptions) {
	const {
		patchProp: hostPatchProp,
		insert: hostInsert,
		remove: hostRemove,
		createElement: hostCreateElement,
		createText: hostCreateText,
		setText: hostSetText,
		setElementText: hostSetElementText,
	} = options;

	//@fn patchProps
	const patchProps = (
		el: RendererElement,
		// key: string,
		vnode: VNode,
		oldProps: Props,
		newProps: Props
	) => {
		if (oldProps !== newProps) {
			console.log("[patchProps]: update", newProps);
			for (const key in newProps) {
				const oldValue = oldProps[key];
				const newValue = newProps[key];
				hostPatchProp(el, key, oldValue, newValue);
			}
			//* 少的属性要进行删除
			for (const key in oldProps) {
				if (!(key in newProps)) {
					hostPatchProp(el, key, oldProps[key], null);
				}
			}
		}
	};

	//@fn processElement
	function processElement(
		n1: VNode | null,
		n2: VNode,
		container: RendererElement,
		anchor?: RendererNode
	) {
		if (!n1) {
			mountElement(n2, container, anchor);
		} else {
			patchElement(n1, n2, container, anchor);
		}
	}

	function patchElement(
		n1: VNode,
		n2: VNode,
		container: RendererElement,
		anchor?: RendererNode
	) {
		console.log("[patchElement]: patch");

		//! 重要的细节：n2 上此时是没有el的
		const el = (n2.el = n1.el);

		//* patch children
		patchChildren(n1, n2, container, anchor);

		//* patch props
		const oldProps = n1.props || EMPTY_OBJ;
		const newProps = n2.props || EMPTY_OBJ;
		patchProps(el, n2, oldProps, newProps);
	}

	//@fn patchCildren
	function patchChildren(
		n1: VNode,
		n2: VNode,
		container: RendererElement,
		parentAnchor?: RendererNode
	) {
		//* 这里默认 n1,n2 都不为null
		// children类型： text or Array 共有四种组合

		if (n2.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			if (n1.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
				//* array -> text: 先 unmount array，然后挂载text
				unmountChildren(n1.children as VNode[]);
				hostSetElementText(container, n2.children as string);
			} else {
				//* text -> text
				if (n1.children !== n2.children) {
					hostSetElementText(container, n2.children as string);
				}
			}
		} else {
			if (n1.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
				//* text -> array 先清空text 再挂载
				hostSetElementText(container, "");
				mountChildren(n2.children as VNode[], container);
			} else {
				patchKeyedChildren(
					n1.children as VNode[],
					n2.children as VNode[],
					container,
					parentAnchor
				);
			}
		}
	}

	function isSameVNode(n1: VNode, n2: VNode) {
		return n1.type === n2.type && n1.key === n2.key;
	}

	//@fn diff algorithm
	function patchKeyedChildren(
		c1: VNode[],
		c2: VNode[],
		container: RendererElement,
		parentAnchor?: RendererNode
	) {
		//? key should always exists in this condition
		let i = 0,
			e1 = c1.length - 1,
			e2 = c2.length - 1;

		//* 从左往右
		while (i <= e1 && i <= e2) {
			const n1 = c1[i];
			const n2 = c2[i];

			if (isSameVNode(n1, n2)) {
				patch(n1, n2, container, parentAnchor); //递归地对比
			} else break;

			i++;
		}

		//* 从右往左
		while (i <= e1 && i <= e2) {
			const n1 = c1[e1];
			const n2 = c2[e2];
			if (isSameVNode(n1, n2)) {
				patch(n1, n2, container, parentAnchor);
			} else break;
			e1--;
			e2--;
		}

		//* 根据 i,e1,e2 的位置分情况讨论
		console.log("test");
		if (i > e1) {
			if (i <= e2) {
				//此时 [i,e2] 的节点是新节点
				const nextPos = e2 + 1;
				const anchor = nextPos >= c2.length ? null : c2[nextPos].el;
				for (let j = i; j <= e2; j++) {
					patch(null, c2[j], container, anchor);
				}
			}
		} else if (i > e2) {
			if (i <= e1) {
				for (let j = i; j <= e1; j++) {
					hostRemove(c1[j].el);
				}
			}
		}
	}

	function processFragment(
		n1: VNode | null,
		n2: VNode,
		container: RendererElement
	) {
		if (!n1) {
			mountChildren(n2.children as VNode[], container);
		} else {
			//todo update element
		}
	}

	function processText(
		n1: VNode | null,
		n2: VNode,
		container: RendererElement
	) {
		if (!n1) {
			const children = n2.children as string;
			const textNode = (n2.el = hostCreateText(children));
			hostInsert(textNode, container);
		} else {
			//todo update element
		}
	}

	//@fn patch
	const patch: PatchFn = (n1, n2, container, anchor?: RendererNode) => {
		//* 两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
		//* 如果新旧的 tagName 不一样，那么直接卸载旧的，然后挂新的上去
		if (n1 && n1.type !== n2.type) {
			unmount(n1);
			n1 = null;
		}

		const { type } = n2;
		switch (type) {
			//* Fragment 类型，只有children
			case Fragment:
				processFragment(n1, n2, container);
				break;
			case Text:
				processText(n1, n2, container);
				break;
			default:
				if (n2.shapeFlag & ShapeFlags.ELEMENT) {
					processElement(n1, n2, container, anchor);
				} else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					processComponent(n1, n2, container);
				} else {
					//todo 其他类型
				}
		}
	};

	//@fn mountElment
	function mountElement(
		vnode: VNode,
		container: RendererElement,
		anchor?: RendererNode
	) {
		//* create element
		const { type, shapeFlag, props, children } = vnode;
		const el = hostCreateElement(type as string);
		//* 引用实际的 dom 元素，用于后续的卸载操作 -> unmount, 以及组件的 this.$el
		vnode.el = el;

		//* process props
		if (props) {
			patchProps(el, vnode, EMPTY_OBJ, props);
		}

		//* process children
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			//* 直接更新文本内容
			hostSetElementText(el, children as string);
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			//* child is vnode
			//* 递归调用，以自己为挂载点
			mountChildren(vnode.children as VNode[], el);
			// (children as VNode[]).forEach(node => {
			// 	//* child 也可能是组件，所以重新调用 patch
			// 	patch(null, node, el);
			// });
		}
		//* insert
		hostInsert(el, container, anchor);
	}

	function mountChildren(children: VNode[], container: RendererElement) {
		children.forEach(node => {
			patch(null, node, container);
		});
	}

	function unmountChildren(children: VNode[]) {
		for (const child of children) {
			hostRemove(child.el);
		}
	}

	//@fn processComponent
	function processComponent(
		n1: VNode | null,
		n2: VNode,
		container: RendererElement
	) {
		if (n1 === null) {
			mountComponent(n2, container);
		} else {
			//+ 本次流程不会涉及
			patchComponent(n1, n2, container);
		}
	}
	// 组件挂载 @fn mountComponent
	function mountComponent(vnode: VNode, container: RendererElement) {
		const instance = createComponentInstance(vnode);

		//* 这一步初始化了Props，slots，setup函数，
		//* component proxy
		setupComponent(instance);

		//* 真正的渲染 + effect
		setupRenderEffect(instance, container);
	}
	//+ 在这里使用 effect @fn setupRendereffect
	function setupRenderEffect(
		instance: ComponentInstance,
		container: RendererElement
	) {
		effect(() => {
			//* 调用组件的render函数以获取vnode，然后挂载
			if (!instance.isMounted) {
				const subTree = (instance.subTree = instance.render());
				patch(null, subTree, container);
				//! 这一步很关键，patch中设置的 el是为subTree节点设置的，这里还要再次赋值
				instance.vnode.el = subTree.el;
				instance.isMounted = true;
			} else {
				console.log("[setupRenderEffect]: update");
				//* 拿到新的 subtree
				//* 这里是由 effect触发的，而 proxy的绑定在setupComponent中，所以需要再次绑定
				const subTree = instance.render.call(instance.proxy);
				const prevSubTree = instance.subTree;
				console.log("prev: ", prevSubTree);
				console.log("current", subTree);
				//! 这里第三个参数一定不能使用container，这里的 container是闭包里面的 container，是顶层容器, 真正用于更新的是 el
				patch(prevSubTree, subTree, prevSubTree.el);
			}
		});
	}

	function patchComponent(n1: VNode, n2: VNode, container: RendererElement) {
		console.log("[Patch component]: patch");
	}

	function unmount(vnode: VNode) {
		//todo 调用生命周期函数 or 钩子函数
		hostRemove(vnode.el);
	}

	//@fn render
	const render: RenderFn = (vnode, container) => {
		if (vnode) {
			//* 有 vnode，进行patch操作
			patch(container._vnode || null, vnode, container);
		} else {
			//* 没有 vnode，卸载节点
			unmount(container._vnode);
		}

		//+ 无论什么操作，都更新 _vnode
		container._vnode = vnode;
	};

	return {
		createApp: createAppAPI(render),
	};
}

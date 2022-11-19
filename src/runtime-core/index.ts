//! 代码中带有 host前缀的表示平台相关的 类型/方法

export interface VNode {
	type: keyof HTMLElementTagNameMap;
	props?: {
		[key: string]: string;
	};
	children: string | VNode[];
	el: RendererElement;
}

//为什么采用这么宽泛的类型？ 因为面向全平台，
//所以RendererElement的类型无法确定
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

//! 坑：patchProp !== patchProps，patchProps只是普通的逻辑抽离,不是options里面的东西
//! 难怪要特意在前面加上 host前缀，有 host就代表平台相关
export function createRenderer(options: RendererOptions): Renderer {
	//解构赋值
	const {
		createElement: hostCreateElement,
		setElementText: hostSetElementText,
		patchProp: hostPatchProp,
		insert: hostInsert,
		remove: hostRemove,
		setText: hostSetText,
		createText: hostCreateText,
	} = options;

	//* -----------------------------------------以下为内部逻辑抽离-----------------------------------------
	const patchProps = (
		el: RendererElement,
		key: string,
		prevValue: any,
		nextValue: any
	) => {
		/*
		 * props 可能有多种情况
		 * 普通的键值对 id="app"
		 * 只有键，不关心值 <buttn disabled/>
		 * 只读 <input form="form1"/>
		 * class 有可能传入的是对象 同时class有多种设置的方法，要选择性能最好的 el.className
		 * //todo vue的绑定属性
		 */
		const type = typeof el[key];

		if (key === "class") {
			//如果 nextValue 是undefined，可能是清除样式的操作
			//className 最快
			el.className = nextValue || "";
		} else if (shouldSetAsProps(el, key, nextValue)) {
			//要设置的属性是 DOM Properties
			//? 例如 buttn 按钮的 disable
			if (type === "boolean" && nextValue === "") {
				el[key] = true;
			} else {
				el[key] = nextValue;
			}
		} else {
			//设置的属性没有 DOM Properties, 使用 setAttribute
			el.setAttribute(key, nextValue);
		}
	};

	const shouldSetAsProps = (el: RendererElement, key: string, value: any) => {
		//特殊处理
		if (key === "form" && el.tagName === "input") return false;
		//兜底
		return key in el;
	};

	const unmount = (vnode: VNode) => {
		//todo 调用生命周期函数 or 钩子函数
		const el = vnode.el;
		const parent = el.parentNode;
		if (parent) parent.removeChild(el);
	};

	//* -------------------------------------------以下为主流程--------------------------------------------

	function mountElement(vnode: VNode, container: RendererElement) {
		const el = hostCreateElement(vnode.type);
		//? 引用实际的 dom 元素，用于正确卸载
		vnode.el = el;

		if (vnode.props) {
			for (const key in vnode.props) {
				patchProps(el, key, null, vnode.props[key]);
			}
		}

		//* process children
		if (typeof vnode.children === "string") {
			//child is plain text
			el.innerHTML = vnode.children;
		} else {
			//child is vnode
			vnode.children.forEach(node => {
				mountElement(node, el);
			});
		}

		//* insert
		hostInsert(el, container);
	}

	const patch: PatchFn = (n1, n2, container) => {
		//两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
		if (!n1) {
			//oldNode 不存在，说明是第一次挂载，直接挂载元素
			mountElement(n2, container);
		} else {
			//TODO 根据新的node和旧的node进行patch操作
		}
	};

	//todo render func
	const render: RenderFn = (vnode, container) => {
		//三种情况：渲染元素，更新元素
		if (vnode) {
			//* 渲染 or 更新，走patch
			patch(container._vnode || null, vnode, container);
		} else {
			//* 卸载
			unmount(container._vnode);
		}

		//* 无论哪种情况，都要更新 container 的 _vnode 属性
		container._vnode = vnode;
	};

	return {
		render,
	};
}

//* 抽离出的平台无关的节点操作逻辑
//* 这里的 元素（HostElement） 和 节点（HostNode）单从类型上来看好像没有任何区别，只是为了逻辑更清晰？
//? 已经渲染的叫元素，未渲染的叫节点？
//todo 弄清 HostElement 和 HostNode 之间的关系
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

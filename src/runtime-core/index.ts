export interface VNode {
	type: keyof HTMLElementTagNameMap;
	props: any; //TODO extract props
	children: string | VNode[];
}

//为什么采用这么宽泛的类型？ 因为面向全平台，
//所以Container的类型无法确定
export type Container = {
	[key: string]: any;
};

export type RenderFunc = (vnode: VNode | null, container: Container) => void;

export type Renderer = {
	render: RenderFunc;
};

export function createRenderer(): Renderer {
	function mountElement(vnode: VNode, container: Container) {
		const el = document.createElement(vnode.type);

		if (typeof vnode.children === "string") {
			//是叶子节点，其内部是普通文本
			el.innerHTML = vnode.children;
		} else {
			//还有嵌套的节点，递归执行
			vnode.children.forEach(node => {
				//挂载位置为新创建的节点
				mountElement(node, el);
			});
		}

		//挂载
		container.appendChild(el);
	}

	/**
	 *
	 * @param n1 old VNode
	 * @param n2 new VNode
	 * @param container 挂载的元素
	 */
	function patch(n1: VNode = undefined, n2: VNode, container: Container) {
		//两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
		if (!n1) {
			//oldNode 不存在，说明是第一次挂载，直接挂载元素
			mountElement(n2, container);
		} else {
			//TODO 根据新的node和旧的node进行patch操作
		}
	}

	function render(vnode: VNode | null, container: Container) {
		//三种情况：渲染元素，更新元素
		if (vnode) {
			//渲染 or 更新，走patch
			patch(container._vnode, vnode, container);
		} else {
			//如果没有vnode，说明此时是一个清空节点的操作
			container.innerHTML = "";
		}

		//无论哪种情况，都要更新 container 的 _vnode 属性
		container._vnode = vnode;
	}

	return {
		render,
	};
}

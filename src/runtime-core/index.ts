export interface VNode {
	type: keyof HTMLElementTagNameMap;
	props?: {
		[key: string]: string;
	};
	children: string | VNode[];
}

//为什么采用这么宽泛的类型？ 因为面向全平台，
//所以Container的类型无法确定
export type Container = {
	[key: string]: any;
};

export type RenderFn = (vnode: VNode | null, container: Container) => void;

export type Renderer = {
	render: RenderFn;
};

export type PatchFn = (
	n1: VNode | null, // null means mount
	n2: VNode,
	container: Container
) => void;

export function createRenderer(): Renderer {
	function mountElement(vnode: VNode, container: Container) {
		const el = document.createElement(vnode.type);
		//TODO process props
		// if (vnode.props) {
		// 	for (const key in vnode.props) {
		// 		el.setAttribute(key, vnode[key]);
		// 	}
		// }

		//* process children
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
		//* insert
		container.appendChild(el);
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

	const render: RenderFn = (vnode, container) => {
		//三种情况：渲染元素，更新元素
		if (vnode) {
			//渲染 or 更新，走patch
			patch(container._vnode || null, vnode, container);
		} else {
			//如果没有vnode，说明此时是一个清空节点的操作
			container.innerHTML = "";
		}

		//无论哪种情况，都要更新 container 的 _vnode 属性
		container._vnode = vnode;
	};

	return {
		render,
	};
}

function createRenderer() {
	function patch(n1, n2, container) {}
	function unmount(container) {}

	function render(vnode, container) {
		if (vnode) {
			patch(container._vnode, vnode, container);
		} else {
			//* 没有 vnode，卸载节点
			unmount(container);
		}
	}

	return {
		render,
	};
}

export const renderer = createRenderer();

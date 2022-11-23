import { createVNode, VNode } from "./vnode";

export type Component = {
	name?: string;
	setup?: () => object | Function;
	render: () => VNode;
};

export type ComponentInstance = {
	vnode: VNode;
	type: Component;
	proxy?: object;
	render?: () => VNode;
	setupState?: object;
};

export function createComponentInstance(vnode: VNode): ComponentInstance {
	return {
		vnode,
		type: vnode.type as Component,
	};
}

export function setupComponent(instance: ComponentInstance) {
	//todo initProps();
	//todo initSlots();
	setupStatefulComponent(instance);
}

export function setupStatefulComponent(instance: ComponentInstance) {
	const component = instance.type;

	//*创建 proxy
	const ctx = {};
	instance.proxy = new Proxy(ctx, {
		get(target, key) {
			if (key in instance.setupState) {
				return instance.setupState[key];
			}
		},
	});

	//* 处理 setup函数
	if (component.setup) {
		const setupResult = component.setup();

		handleSetupResult(instance, setupResult);
	}
}
export function handleSetupResult(
	instance: ComponentInstance,
	setupResult: object | Function
) {
	if (typeof setupResult === "object") {
		instance.setupState = setupResult;
	} else {
		//todo setupResult as Function
	}

	//* finish setup
	//* 把 render函数放入instance中
	finishComponentSetup(instance);
}

function finishComponentSetup(instance: ComponentInstance) {
	const component = instance.type;
	const render = component.render;
	if (render) {
		instance.render = render.bind(instance.proxy);
	}
}

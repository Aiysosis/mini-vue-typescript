import { VNode } from "./vnode";

export type Component = {
	name?: string;
	setup?: () => object | Function;
	render: () => VNode;
};

export type ComponentInstance = {
	vnode: VNode;
	render?: () => VNode;
	setupState?: object;
};

export function createComponentInstance(vnode: VNode): ComponentInstance {
	return {
		vnode,
	};
}

export function setupComponent(instance: ComponentInstance) {
	//todo initProps();
	//todo initSlots();
	setupStatefulComponent(instance);
}

export function setupStatefulComponent(instance: ComponentInstance) {
	const { setup } = instance.vnode.type as Component;
	if (setup) {
		const setupResult = setup();

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
	const component = instance.vnode.type as Component;
	const render = component.render;
	if (render) {
		instance.render = render;
	}
}

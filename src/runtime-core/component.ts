import { shallowReadonly } from "@/reactivity/reactive";
import { extend } from "@/shared/index";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { createVNode, Props, VNode } from "./vnode";

export type Component = {
	name?: string;
	setup?: (props?: Props) => object | Function;
	render: () => VNode;
};

export type ComponentInstance = {
	vnode: VNode;
	type: Component;
	props?: Props;
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
	initProps(instance);
	//todo initSlots();
	setupStatefulComponent(instance);
}

export function setupStatefulComponent(instance: ComponentInstance) {
	const component = instance.type;

	//*创建 proxy
	const ctx = { _: instance };
	instance.proxy = new Proxy(ctx, PublicInstanceProxyHandlers);

	//* 处理 setup函数
	if (component.setup) {
		const setupResult = component.setup(shallowReadonly(instance.props));

		handleSetupResult(instance, setupResult);
	}
}
export function handleSetupResult(
	instance: ComponentInstance,
	setupResult: object | Function
) {
	if (typeof setupResult === "object") {
		instance.setupState = setupResult;
		//extends(setupResult,instance.props)
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
		//* 绑定 this
		instance.render = render.bind(instance.proxy);
	}
}

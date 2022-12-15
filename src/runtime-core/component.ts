import { Runner } from "@/reactivity/effect";
import { shallowReadonly } from "@/reactivity/reactive";
import { extend } from "@/shared/index";
import { proxyRefs } from "../reactivity/index";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots, InternalSlots } from "./componentSlots";
import { createVNode, Props, VNode } from "./vnode";

export type Data = Record<string, unknown>;

export type Component = {
	name?: string;
	template?: string;
	setup?: (
		props?: Props,
		emitsObject?: { emit: Function }
	) => object | Function;
	render: () => VNode;
};

export type ComponentInstance = {
	vnode: VNode;
	type: Component;
	emit: Function;
	props: Props;
	slots: InternalSlots | null;
	isMounted: boolean;
	subTree: VNode;
	proxy: ComponentInstance | null;
	render?: (_ctx?: any) => VNode;
	update: Runner;
	setupState?: Data;
	next: VNode | null;
};

export function createComponentInstance(vnode: VNode): ComponentInstance {
	const instance: ComponentInstance = {
		vnode,
		type: vnode.type as Component,
		props: null,
		setupState: null,
		proxy: null,
		emit: null!, //+ to be set immediately
		slots: null,
		update: null,
		isMounted: false,
		subTree: null!, //+ will be set after creation
		next: null,
	};
	//* 这里用了一个小 trick ，使用 bind函数来提前输入一些内部的参数，这样用户调用的时候就轻松很多
	instance.emit = emit.bind(null, instance);
	return instance;
}

export function setupComponent(instance: ComponentInstance) {
	initProps(instance);
	initSlots(instance);
	setupStatefulComponent(instance);
}

export function setupStatefulComponent(instance: ComponentInstance) {
	const component = instance.type;

	//*创建 proxy
	const ctx = { _: instance };
	instance.proxy = new Proxy(ctx, PublicInstanceProxyHandlers);

	//* 处理 setup函数
	if (component.setup) {
		//* currentInstance 只在setup函数调用的时候可以被读取
		setCurrentInstance(instance);
		const setupResult = component.setup(shallowReadonly(instance.props), {
			emit: instance.emit,
		});
		setCurrentInstance(null);

		handleSetupResult(instance, setupResult);
	}
}
export function handleSetupResult(
	instance: ComponentInstance,
	setupResult: object | Function
) {
	if (typeof setupResult === "object") {
		instance.setupState = proxyRefs(setupResult as Data);
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
	} else if (compiler && !instance.render) {
		//* 执行编译函数
		if (component.template) {
			component.render = compiler(component.template);
			instance.render = component.render;
		}
	}
}

let currentInstance: ComponentInstance = null;

export function getCurrentInstance() {
	return currentInstance;
}

function setCurrentInstance(instance: ComponentInstance | null) {
	currentInstance = instance;
}

let compiler;

export function registerRuntimeComplier(_complier) {
	compiler = _complier;
}

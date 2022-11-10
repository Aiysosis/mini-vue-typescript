import {
	mutableHandlers,
	readonlyHandlers,
	shallowReadonlyHandlers,
} from "./baseHandlers";

export const enum ReactiveFlags {
	IS_REACTIVE = "__v_is_reactive",
	IS_READONLY = "__v_is_readonly",
}

function createReactiveObject<T extends object>(
	raw: T,
	baseHandlers: ProxyHandler<object>
) {
	return new Proxy<T>(raw, baseHandlers);
}

export function reactive<T extends object>(raw: T) {
	return createReactiveObject(raw, mutableHandlers);
}

export function readonly<T extends object>(raw: T) {
	return createReactiveObject(raw, readonlyHandlers);
}

export function shallowReadonly<T extends object>(raw: T) {
	return createReactiveObject(raw, shallowReadonlyHandlers);
}

export const isReactive = (val: any) => !!val[ReactiveFlags.IS_REACTIVE];

export const isReadonly = (val: any) => !!val[ReactiveFlags.IS_READONLY];

export const isProxy = (val: any) => isReactive(val) || isReadonly(val);

import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

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

export const isReactive = (val: any) => !!val[ReactiveFlags.IS_REACTIVE];

export const isReadonly = (val: any) => !!val[ReactiveFlags.IS_READONLY];

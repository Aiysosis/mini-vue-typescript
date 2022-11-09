import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function reactive<T extends object>(raw: T) {
	return createReactiveObject(raw, mutableHandlers);
}

export function readOnly<T extends object>(raw: T) {
	return createReactiveObject(raw, readonlyHandlers);
}

function createReactiveObject<T extends object>(
	raw: T,
	baseHandlers: ProxyHandler<object>
) {
	return new Proxy<T>(raw, baseHandlers);
}

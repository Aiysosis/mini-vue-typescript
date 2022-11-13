import { extend, isObject } from "@/shared/index";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
	return function get(target: object, key: string) {
		if (key === ReactiveFlags.IS_REACTIVE) {
			return !isReadonly;
		}
		if (key === ReactiveFlags.IS_READONLY) {
			return isReadonly;
		}

		const res = Reflect.get(target, key);

		if (shallow) return res;

		if (isObject(res)) return isReadonly ? readonly(res) : reactive(res);

		if (!isReadonly) track(target, key);

		return res;
	};
}

function createSetter() {
	return function set(target: object, key: string, value: any) {
		const res = Reflect.set(target, key, value);

		trigger(target, key);

		return res;
	};
}

export const mutableHandlers: ProxyHandler<object> = {
	get,
	set,
};

export const readonlyHandlers: ProxyHandler<object> = {
	get: readonlyGet,
	set(target, key: string) {
		console.warn(
			`key${key} is not assignable because it's readonly`,
			target
		);
		return true;
	},
};

export const shallowReadonlyHandlers: ProxyHandler<object> = extend(
	{},
	readonlyHandlers,
	{
		get: shallowReadonlyGet,
	}
);

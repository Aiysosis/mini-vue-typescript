import { track, trigger } from "./effect";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
	return function get(target: object, key: string) {
		const res = Reflect.get(target, key);

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

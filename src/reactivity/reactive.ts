import { track, trigger } from "./effect";

export function reactive<T extends object>(raw: T) {
	let proxy = new Proxy<T>(raw, {
		get(obj, key: string) {
			const res = Reflect.get(obj, key);

			track(obj, key);

			return res;
		},
		set(obj, key: string, val) {
			const res = Reflect.set(obj, key, val);

			trigger(obj, key);

			return res;
		},
	});
	return proxy;
}

export function readOnly<T extends object>(raw: T) {
	let proxy = new Proxy<T>(raw, {
		get(obj, key: string) {
			const res = Reflect.get(obj, key);
			return res;
		},
		set(obj, key: string, val) {
			return true;
		},
	});
	return proxy;
}

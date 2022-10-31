import { track, trigger } from "./effect";

export function reactive(raw) {
	let proxy = new Proxy(raw, {
		get(obj, key) {
			const res = Reflect.get(obj, key);

			track(obj, key);

			return res;
		},
		set(obj, key, val) {
			const res = Reflect.set(obj, key, val);

			trigger(obj, key);

			return res;
		},
	});
	return proxy;
}

import { hasChanged, isObject } from "@/shared/index";
import { Dep, isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive, toReactive } from "./reactive";

interface Ref<T> {
	value: T;
	dep?: Dep;
}

class RefImpl<T> {
	private _value: T;
	public _rawValue: T;
	public dep?: Dep = undefined;
	public __v_is_ref = true;
	constructor(val: T) {
		this._rawValue = val;
		this._value = toReactive(val);
	}

	get value(): T {
		let res: any = this._value;
		trackRefValue(this);
		return res;
	}

	set value(newValue: any) {
		if (!hasChanged(newValue, this._rawValue)) return;
		this._rawValue = newValue;
		this._value = toReactive(newValue);
		if (this.dep) triggerEffects(this.dep);
	}
}

function trackRefValue<T extends unknown>(ref: RefImpl<T>) {
	if (!ref.dep) ref.dep = new Set();
	if (isTracking()) {
		trackEffects(ref.dep);
	}
}

export function ref<T extends unknown>(raw: T): Ref<T> {
	return new RefImpl(raw);
}

export const isRef = (val: any): val is Ref<any> => !!val.__v_is_ref;

// export const unRef = (val: any) => (isRef(val) ? val.value : val);
export function unRef<T>(val: T): UnRef<T> {
	if (isRef(val)) {
		return unRef(val.value);
	} else {
		return val as UnRef<T>;
	}
}

type UnRef<T> = T extends object
	? T extends Ref<infer V>
		? V
		: T
	: T extends infer F
	? F
	: never;

type UnwrapRef<T extends object> = {
	[K in keyof T]: T[K] extends Ref<infer V> ? V : T[K];
} extends infer F
	? F
	: never;

export function proxyRefs<T extends object>(val: T): UnwrapRef<T> {
	return new Proxy<T>(val, {
		get(target, key) {
			return unRef(Reflect.get(target, key));
		},
		set(target, key, value) {
			if (isRef(target[key]) && !isRef(value)) {
				return (target[key].value = value);
			} else return Reflect.set(target, key, value);
		},
	}) as UnwrapRef<T>;
}

import { hasChanged, isObject } from "@/shared/index";
import { Dep, isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive, toReactive } from "./reactive";

class RefImpl<T> {
	private _value: T;
	private _rawValue: T;
	public dep?: Dep = undefined;
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
		console.log(newValue, this._rawValue);
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

export function ref<T extends unknown>(raw: T) {
	return new RefImpl(raw);
}

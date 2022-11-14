import { ReactiveEffect } from "./effect";

class computedImpl<T> {
	private _getter: () => T;
	private _dirty = true;
	private _value: T;
	private _effect: ReactiveEffect;

	constructor(getter: () => T) {
		this._getter = getter;

		this._effect = new ReactiveEffect(this._getter, {
			scheduler: () => {
				if (!this._dirty) this._dirty = true;
			},
		});
	}

	get value() {
		if (this._dirty) {
			this._value = this._effect.run();
			this._dirty = false;
		}
		return this._value;
	}
}

export function computed<T>(fn: () => T) {
	return new computedImpl<T>(fn);
}

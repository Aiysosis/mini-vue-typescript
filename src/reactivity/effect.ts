class ReactiveEffect {
	private _fn: Function;
	scheduler: Function | undefined;

	constructor(fn: Function, scheduler?: Function) {
		this._fn = fn;
		this.scheduler = scheduler;
	}
	run(this: ReactiveEffect) {
		activeEffect = this;
		return this._fn();
	}
}

/**
 * Data Structure:
 * TargetMap: WeakMap -> depsMap: Map -> deps: Set
 */
type DepsMap = Map<string, Set<ReactiveEffect>>;
type TargetMap = WeakMap<object, DepsMap>;
const targetMap: TargetMap = new WeakMap();

/**
 *
 * @param target 对象
 * @param key 属性名
 */
export function track(target: object, key: string) {
	//target->key->dep(depends)
	//targetMap->depMap->dep
	let depsMap = targetMap.get(target);
	if (!depsMap) {
		depsMap = new Map();
		targetMap.set(target, depsMap);
	}
	let deps = depsMap.get(key);
	if (!deps) {
		deps = new Set();
		depsMap.set(key, deps);
	}
	deps.add(activeEffect);
}

/**
 *
 * @param target 对象
 * @param key 属性名
 */
export function trigger(target: object, key: string) {
	let depsMap = targetMap.get(target);
	let deps = depsMap.get(key);
	for (let effect of deps) {
		if (effect.scheduler) {
			effect.scheduler();
		} else {
			effect.run();
		}
	}
}

let activeEffect: ReactiveEffect;
type EffectOpts = {
	["scheduler"]: Function;
};
export function effect(fn: Function, options?: EffectOpts) {
	let _effect = new ReactiveEffect(fn, options?.scheduler);
	_effect.run();
	return _effect.run.bind(_effect); //绑定this,但是不立即执行
}

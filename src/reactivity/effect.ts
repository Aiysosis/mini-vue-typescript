import { extend } from "./../shared/index";
let activeEffect: ReactiveEffect;
let shouldTrack = false;

class ReactiveEffect {
	private _fn: Function;
	scheduler: Function | undefined;
	deps: Set<ReactiveEffect>[] = [];
	active = true; //用于实现只stop一次
	onStop?: Function;

	constructor(fn: Function, scheduler?: Function) {
		this._fn = fn;
		this.scheduler = scheduler;
	}
	run(this: ReactiveEffect) {
		if (!this.active) {
			return this._fn();
		}
		shouldTrack = true;
		activeEffect = this;
		const res = this._fn();
		shouldTrack = false;
		return res;
	}
	stop(this: ReactiveEffect) {
		if (this.active) {
			cleanupEffect(this);
			this.active = false;
			if (this.onStop) {
				this.onStop();
			}
		}
	}
}

function cleanupEffect(effect: ReactiveEffect) {
	for (let dep of effect.deps) {
		dep.delete(effect);
	}
	effect.deps.length = 0; //直接清空掉
}

export type Dep = Set<ReactiveEffect>;
export type DepsMap = Map<string, Dep>;
export type TargetMap = WeakMap<object, DepsMap>;

/**
 * Data Structure:
 * TargetMap: WeakMap -> depsMap: Map -> deps: Set
 */
const targetMap: TargetMap = new WeakMap();

/**
 *
 * @param target 对象
 * @param key 属性名
 */
export function track(target: object, key: string) {
	// if (!activeEffect) return;
	/*if (!activeEffect.active) return;这样是不安全的，虽然可以通过相关测试
	  因为activeEffect是公共的变量，如果创建了两个effect，然后stop第一个，那么一定会出问题
	 */
	// if (!shouldTrack) return;
	if (!isTracking()) return;

	let depsMap = targetMap.get(target);
	if (!depsMap) {
		depsMap = new Map();
		targetMap.set(target, depsMap);
	}
	let dep = depsMap.get(key);
	if (!dep) {
		dep = new Set();
		depsMap.set(key, dep);
	}

	trackEffects(dep);
}

export function trackEffects(dep: Dep) {
	if (dep.has(activeEffect)) return;
	dep.add(activeEffect);
	activeEffect.deps.push(dep);
}

export const isTracking = () => activeEffect && shouldTrack;

/**
 *
 * @param target 对象
 * @param key 属性名
 */
export function trigger(target: object, key: string) {
	let depsMap = targetMap.get(target);
	let dep = depsMap.get(key);
	//如果有scheduler那么运行scheduler，否则运行run
	triggerEffects(dep);
}

export function triggerEffects(dep: Dep) {
	for (let effect of dep) {
		if (effect.scheduler) {
			effect.scheduler();
		} else {
			effect.run();
		}
	}
}

type EffectOpts = {
	["scheduler"]?: Function;
	["onStop"]?: Function;
};

type Runner = {
	effect: ReactiveEffect;
	(): any;
};

export function effect(fn: Function, options: EffectOpts = {}) {
	let _effect = new ReactiveEffect(fn, options.scheduler);
	// _effect.onStop = options.onStop;
	extend(_effect, options);
	//直接用runner去比对会浪费性能，可以runner中指向_effect，这样可以更方便操作
	//为此需要定义类型
	const runner: Runner = _effect.run.bind(_effect) as Runner;
	runner.effect = _effect;
	_effect.run();
	return runner;
}

export function stop(runner: Runner) {
	runner.effect.stop();
}

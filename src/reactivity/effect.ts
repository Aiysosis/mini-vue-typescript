import { extend } from "./../shared/index";

//TargetMap > DepsMap > Dep > ReactiveEffect
export type TargetMap = WeakMap<object, DepsMap>;
export type DepsMap = Map<string, Dep>;
export type Dep = Set<ReactiveEffect>;

const targetMap: TargetMap = new WeakMap();

let activeEffect: ReactiveEffect;
let shouldTrack = false;

export class ReactiveEffect {
	private _fn: Function;
	public scheduler?: Function;
	public deps?: Dep[];
	public active = true; //用于实现只stop一次
	public onStop?: Function;

	constructor(fn: Function, options?: EffectOpts) {
		this._fn = fn;
		extend(this, options);
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
			//不需要反复清理
			cleanupEffect(this);
			this.active = false;
			if (this.onStop) {
				this.onStop();
			}
		}
	}
}

function cleanupEffect(effect: ReactiveEffect) {
	if (!effect.deps) return;
	for (let dep of effect.deps) {
		dep.delete(effect);
	}
	effect.deps.length = 0; //直接清空deps
}

/**
 *
 * @param target 对象
 * @param key 属性名
 */
//这里的key使用了string，symbol的情况就没有考虑了
export function track(target: object, key: string) {
	/*if (!activeEffect.active) return;这样是不安全的，虽然可以通过相关测试
	  因为activeEffect是公共的变量，如果创建了两个effect，然后stop第一个，那么一定会出问题
	 */
	//stop之后就不需要track了，所以判断shouldTrack
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

	if (!activeEffect.deps) activeEffect.deps = [];
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
	if (!depsMap) return;
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

export type Runner = {
	effect: ReactiveEffect;
	(): any;
};

export function effect(fn: Function, options: EffectOpts = {}) {
	let _effect = new ReactiveEffect(fn, options);
	//直接用runner去比对会浪费性能，可以runner中的this指向_effect，这样可以更方便操作
	//为此需要定义类型
	const runner: Runner = _effect.run.bind(_effect) as Runner;
	runner.effect = _effect;
	_effect.run();
	return runner;
}

export function stop(runner: Runner) {
	runner.effect.stop();
}

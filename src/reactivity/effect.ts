class ReactiveEffect {
	private _fn: Function;
	scheduler: Function | undefined;
	depsArr: Set<ReactiveEffect>[] = [];

	constructor(fn: Function, scheduler?: Function) {
		this._fn = fn;
		this.scheduler = scheduler;
	}
	run(this: ReactiveEffect) {
		activeEffect = this;
		return this._fn();
	}
	stop(this: ReactiveEffect) {
		for (let deps of this.depsArr) {
			deps.delete(this);
		}
	}
}

type DepsMap = Map<string, Set<ReactiveEffect>>;
type TargetMap = WeakMap<object, DepsMap>;

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
	activeEffect.depsArr.push(deps);
}

/**
 *
 * @param target 对象
 * @param key 属性名
 */
export function trigger(target: object, key: string) {
	let depsMap = targetMap.get(target);
	let deps = depsMap.get(key);
	//如果有scheduler那么运行scheduler，否则运行run
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
	["scheduler"]?: Function;
};

type Runner = {
	effect: ReactiveEffect;
	(): any;
};

export function effect(fn: Function, options?: EffectOpts) {
	let _effect = new ReactiveEffect(fn, options?.scheduler);
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

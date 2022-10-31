class ReactiveEffect {
	private _fn: Function;

	constructor(fn: Function) {
		this._fn = fn;
	}
	run() {
		activeEffect = this;
		this._fn();
	}
}

//注册依赖需要相应的数据结构
/*依赖体现为函数，一个key可以绑定多个依赖，一个对象有多个key，可能有多个对象
DS-(oneToMany)->target-(oneToMany)->key-(oneToMany)->ReactiveEffect
*/

/**
 * key:target(Object)
 * value:keyMap(Map)
 */
const targetMap = new Map();
/**
 * target[key]：被依赖的属性
 * @param target
 * @param key
 */
export function track(target, key) {
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

export function trigger(target, key) {
	let depsMap = targetMap.get(target);
	let deps = depsMap.get(key);
	for (let effect of deps) {
		effect.run();
	}
}

let activeEffect;
export function effect(fn: Function) {
	let _effect = new ReactiveEffect(fn);
	_effect.run();
}

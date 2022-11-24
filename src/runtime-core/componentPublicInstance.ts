import { ComponentInstance } from "./component";

//* 太长取简写
type I = ComponentInstance;

export type PublicPropertiesMap = Record<string, (i: I) => any>;

export interface ComponentRenderContext {
	[key: string]: any;
	_: I;
}

//* 新增的属性修改这里即可
export const publicProprietiesMap: PublicPropertiesMap = {
	$el: (i: I) => i.vnode.el,
};

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
	get(target: ComponentRenderContext, key: string) {
		//* target是ctx，它的 _ 属性是instance，使用解构赋值然后重命名
		const { _: instance } = target;
		const getter = publicProprietiesMap[key];
		if (getter) {
			return getter(instance);
		} else if (
			instance.setupState &&
			instance.setupState.hasOwnProperty(key)
		) {
			return instance.setupState[key];
		} else {
			return undefined;
		}
	},
};

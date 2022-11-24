import { ComponentInstance } from "./component";

//* 太长取简写
type I = ComponentInstance;

//* 新增的属性修改这里即可
export const publicProprietiesMap = {
	$el: (i: I) => i.vnode.el,
};

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
	get(target, key) {
		//* target是ctx，它的 _ 属性是instance，使用解构赋值然后重命名
		const { _: instance } = target;
		if (key in publicProprietiesMap) {
			return publicProprietiesMap[key](instance);
		} else if (key in instance.setupState) {
			return instance.setupState[key];
		}
	},
};

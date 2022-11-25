/**
 * 用于测试 component props 的功能
 * 1. 父组件可以向子组件的 setup 传入 props
 * 2. 子组件通过 this 可以访问 props
 * 3. props 是 shallow readonly。
 */

import { h } from "../../lib/aiyso-vue.esm.js";

export const Foo = {
	//* 这里 emit 的调用方法可以视为解构赋值
	setup(props, { emit }) {
		console.log(props);

		const emitAdd = () => {
			console.log("[Foo]: emit add");
			emit("add-foo", 114, 514);
		};

		return {
			emitAdd,
		};
	},
	render() {
		const btn = h(
			"button",
			{
				onClick: this.emitAdd,
			},
			"EmitAdd"
		);
		const p = h("p", {}, "foo");

		return h("div", { class: "foo-container" }, [p, btn]);
	},
};

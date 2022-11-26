import { h, renderSlots } from "../../lib/aiyso-vue.esm.js";

export const Foo = {
	setup() {
		return {};
	},
	render() {
		const foo = h("p", {}, "Foo");

		//* 在这里指定渲染的顺序（必须和 app.js中给定的属性名保持一致）
		//* 具名插槽
		//* slots 作用域
		return h("div", {}, [
			renderSlots(this.$slots, "header", {
				name: "Tom",
			}),
			foo,
			renderSlots(this.$slots, "footer"),
		]);
	},
};

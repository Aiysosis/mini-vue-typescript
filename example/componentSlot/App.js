//? App是一个组件
import { h, createTextVNode } from "../../lib/aiyso-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
	render() {
		const app = h("div", {}, "This is App");
		//这里的children是插槽(slot)
		const foo = h(
			Foo,
			{},
			{
				//* 参数要采用解构赋值
				header: ({ name }) => [
					h("p", {}, "this is header " + name),
					createTextVNode("你好呀"),
				],
				footer: () => h("p", {}, "this is footer"),
			}
		);

		return h("div", {}, [app, foo]);
	},
	setup() {
		return {};
	},
};

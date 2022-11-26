//? App是一个组件
import { h } from "../../lib/aiyso-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
	render() {
		const app = h("div", {}, "This is App");
		//这里的children是插槽(slot)
		const foo = h(
			Foo,
			{},
			{
				header: h("p", {}, "this is header"),
				footer: h("p", {}, "this is footer"),
			}
		);

		return h("div", {}, [app, foo]);
	},
	setup() {
		return {};
	},
};

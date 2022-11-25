//? App是一个组件
import { h } from "../../lib/aiyso-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
	render() {
		return h("div", { class: "container" }, [
			h("div", {}, "This is App"),
			h(Foo, {
				onAddFoo: (a, b) => {
					console.log("[App]: catch emit add");
					console.log("[Args]: ", a, b);
				},
			}),
		]);
	},
	setup() {
		return {};
	},
};

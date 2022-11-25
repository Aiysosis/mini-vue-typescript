//? App是一个组件
import { h } from "../../lib/aiyso-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
	render() {
		return h("div", { class: "container" }, [
			h(
				"h1",
				{
					class: "red",
					onclick: () => {
						alert(this.$el);
					},
				},
				"Hello"
			),
			h(
				"h1",
				{
					class: "blue",
				},
				this.msg
			),
			h(Foo, {
				count: 1,
			}),
		]);
	},
	setup() {
		return {
			msg: "vue",
		};
	},
};

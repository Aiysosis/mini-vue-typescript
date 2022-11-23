//? App是一个组件
import { h } from "../../lib/aiyso-vue.esm.js";
export const App = {
	render() {
		return h("div", { class: "container" }, [
			h(
				"h1",
				{
					class: "red",
					onclick: () => {
						alert("whassup man?");
					},
				},
				"Hello"
			),
			h(
				"h1",
				{
					class: "blue",
				},
				"vue"
			),
		]);
	},
	setup() {
		return {
			msg: "hello vue",
		};
	},
};

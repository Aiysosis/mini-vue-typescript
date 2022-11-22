//? App是一个组件
import { h } from "../../lib/aiyso-vue.esm.js";
export const App = {
	render() {
		return h("div", "", "Hello vue");
	},
	setup() {
		msg: "hello vue";
	},
};

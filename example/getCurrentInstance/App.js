//? App是一个组件
import { h, getCurrentInstance } from "../../lib/aiyso-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
	name: "app",
	render() {
		return h("div", {}, [h("p", {}, "Get current instance"), h(Foo)]);
	},
	setup() {
		const instance = getCurrentInstance();
		console.log("[App]: ", instance);
		return {};
	},
};

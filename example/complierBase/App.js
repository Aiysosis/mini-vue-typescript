//? App是一个组件
import { ref } from "../../lib/aiyso-vue.esm.js";
export const App = {
	name: "App",
	template: "<div>hi, {{count}}</div>",
	setup() {
		const count = (window.count = ref(0));

		return {
			count,
		};
	},
};

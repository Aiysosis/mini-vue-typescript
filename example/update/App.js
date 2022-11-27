//? App是一个组件
import { h, ref } from "../../lib/aiyso-vue.esm.js";
export const App = {
	setup() {
		const count = ref(0);

		const onClick = () => {
			count.value++;
		};

		return {
			count,
			onClick,
		};
	},

	render() {
		return h("div", { class: "container" }, [
			h("p", {}, "count: " + this.count),
			h("button", { onClick: this.onClick }, "clickMe"),
		]);
	},
};

//? App是一个组件
import {
	getCurrentInstance,
	h,
	ref,
	nextTick,
} from "../../lib/aiyso-vue.esm.js";
export const App = {
	name: "App",
	setup() {
		const count = ref(0);

		const instance = getCurrentInstance();

		const onClick = () => {
			for (let i = 0; i < 100; i++) {
				count.value++;
			}
		};

		console.log("instance: ", instance);

		nextTick(() => {
			console.log("instance: ", instance);
		});

		return {
			count,
			onClick,
		};
	},

	render() {
		return h("div", {}, [
			h("p", {}, "count: " + this.count),
			h("button", { onClick: this.onClick }, "clickMe"),
		]);
	},
};

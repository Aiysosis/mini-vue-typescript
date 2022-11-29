import { h, ref } from "../../lib/aiyso-vue.esm.js";

const nextChildren = "new children";
const prevChildren = "old children";

export const TextToText = {
	name: "TextToText",
	render() {
		const self = this;

		return self.isChange === true
			? h("div", {}, nextChildren)
			: h("div", {}, prevChildren);
	},
	setup() {
		const isChange = ref(false);
		window.isChange = isChange; //让值可以通过window访问

		return {
			isChange,
		};
	},
};

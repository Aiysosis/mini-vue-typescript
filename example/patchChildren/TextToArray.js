import { h, ref } from "../../lib/aiyso-vue.esm.js";

const nextChildren = [h("div", {}, "A"), h("div", {}, "B")];
const prevChildren = "old children";

export const TextToArray = {
	name: "TextToArray",
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

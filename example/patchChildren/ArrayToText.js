import { h, ref } from "../../lib/aiyso-vue.esm.js";

const nextChildren = "new children";
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];

export const ArrayToText = {
	name: "ArrayToText",
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

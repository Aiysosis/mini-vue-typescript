import { h, ref } from "../../lib/aiyso-vue.esm.js";

export const Child = {
	name: "Child",
	setup(props) {},
	render() {
		return h("p", {}, "[child]: " + this.$props.msg);
	},
};

/**
 * 用于测试 component props 的功能
 * 1. 父组件可以向子组件的 setup 传入 props
 * 2. 子组件通过 this 可以访问 props
 * 3. props 是 shallow readonly。
 */

import { h } from "../../lib/aiyso-vue.esm.js";

export const Foo = {
	setup(props) {
		console.log(props);
	},
	render() {
		return h("h2", {}, `count: ${this.count}`);
	},
};

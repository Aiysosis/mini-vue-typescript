import { h, ref } from "../../lib/aiyso-vue.esm.js";

//+ 1. 只添加元素
//+ a b c       d e f
//+ a b c h i j d e f
// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C"),
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "E" }, "E"),
// 	h("p", { key: "F" }, "F"),
// ];
// const nextChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C"),
// 	h("p", { key: "H" }, "H"),
// 	h("p", { key: "I" }, "I"),
// 	h("p", { key: "J" }, "J"),
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "E" }, "E"),
// 	h("p", { key: "F" }, "F"),
// ];

//+ 2.只删除元素
// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C"),
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "E" }, "E"),
// 	h("p", { key: "F" }, "F"),
// 	h("p", { key: "G" }, "G"),
// ];
// const nextChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "F" }, "F"),
// 	h("p", { key: "G" }, "G"),
// ];

//+ 3. 复合情形（有元素删除，有元素新增，也有元素更换位置）
//+ a b *c -d f g
//+ a b +e *c f g
// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C", id: "prev-c" }, "C"),
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "F" }, "F"),
// 	h("p", { key: "G" }, "G"),
// ];
// const nextChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "E" }, "E"),
// 	h("p", { key: "C", id: "next-c" }, "C"),
// 	h("p", { key: "F" }, "F"),
// 	h("p", { key: "G" }, "G"),
// ];

//+ 4. 纯移动的情形，应用 最长递增子序列算法
const prevChildren = [
	h("p", { key: "A" }, "A"),
	h("p", { key: "B" }, "B"),

	h("p", { key: "C" }, "C"),
	h("p", { key: "D" }, "D"),
	h("p", { key: "E" }, "E"),

	h("p", { key: "F" }, "F"),
	h("p", { key: "G" }, "G"),
];
const nextChildren = [
	h("p", { key: "A" }, "A"),
	h("p", { key: "B" }, "B"),

	h("p", { key: "D" }, "D"),
	h("p", { key: "E" }, "E"),
	h("p", { key: "C" }, "C"),

	h("p", { key: "F" }, "F"),
	h("p", { key: "G" }, "G"),
];

export const ArrayToArray = {
	name: "ArrayToArray",
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

import { h, ref } from "../../lib/aiyso-vue.esm.js";

//+ 1. 左侧对比
//+ (a b) c
//+ (a b) d e
// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C"),
// ];
// const nextChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "E" }, "E"),
// ];

//+ 2. 右侧对比
//+   a (b c)
//+ d e (b c)
// const prevChildren = [
// 	h("p", { key: "A" }, "A"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C"),
// ];
// const nextChildren = [
// 	h("p", { key: "D" }, "D"),
// 	h("p", { key: "E" }, "E"),
// 	h("p", { key: "B" }, "B"),
// 	h("p", { key: "C" }, "C"),
// ];

//+ 3. 添加元素
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

//+ 4.删除元素
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

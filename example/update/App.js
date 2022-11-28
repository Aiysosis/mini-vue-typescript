//? App是一个组件
import { h, ref } from "../../lib/aiyso-vue.esm.js";
export const App = {
	name: "App",
	setup() {
		const count = ref(0);

		const onClick = () => {
			count.value++;
		};

		const props = ref({
			foo: "foo",
			bar: "bar",
		});

		const onChangePropsDemo1 = () => {
			//* props某个属性值发生变化
			props.value.foo = "new-foo";
		};
		const onChangePropsDemo2 = () => {
			//* props某个属性消失 expected: 该属性被删除
			props.value.foo = undefined;
		};
		const onChangePropsDemo3 = () => {
			//* props全部重新赋值，且某个属性消失 expected: 该属性被删除
			props.value = {
				foo: "foo",
				tom: "cat",
			};
		};

		return {
			count,
			onClick,
			props,
			onChangePropsDemo1,
			onChangePropsDemo2,
			onChangePropsDemo3,
		};
	},

	render() {
		return h("div", { id: "root", ...this.props }, [
			h("p", {}, "count: " + this.count),
			h("button", { onClick: this.onClick }, "clickMe"),
			h("button", { onClick: this.onChangePropsDemo1 }, "change foo"),
			h(
				"button",
				{ onClick: this.onChangePropsDemo2 },
				"set foo undefined"
			),
			h("button", { onClick: this.onChangePropsDemo3 }, "delete bar"),
		]);
	},
};

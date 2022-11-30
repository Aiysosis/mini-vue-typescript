//? App是一个组件
import { h } from "../../lib/aiyso-vue.esm.js";
import { ArrayToArray } from "./ArrayToArray.js";
import { ArrayToText } from "./ArrayToText.js";
import { TextToArray } from "./TextToArray.js";
import { TextToText } from "./TextToText.js";
export const App = {
	name: "App",
	render() {
		return h("div", { tId: 1 }, [
			h("p", {}, "Home page"),
			// h(TextToArray),
			// h(TextToText),
			h(ArrayToArray),
			// h(ArrayToText),
		]);
	},
	setup() {},
};

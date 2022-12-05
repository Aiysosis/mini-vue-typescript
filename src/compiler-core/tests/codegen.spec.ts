import { codegen } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("codegen", () => {
	// see https://template-explorer.vuejs.org
	test("string", () => {
		const ast = baseParse("hi");

		transform(ast);

		console.log("ast: ", ast);

		const { code } = codegen(ast);

		expect(code).toMatchSnapshot();
	});

	test.only("interpolation", () => {
		/**
         * *{{ message }}
         * import { toDisplayString as _toDisplayString } from "vue"

            export function render(_ctx, _cache, $props, $setup, $data, $options) {
            return _toDisplayString(_ctx.message)
            }
         */
		const ast = baseParse("{{ message }}");

		transform(ast);

		console.log("ast: ", ast);

		const { code } = codegen(ast);

		expect(code).toMatchSnapshot();
	});
});

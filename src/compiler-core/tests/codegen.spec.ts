import { codegen } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

describe("codegen", () => {
	// see https://template-explorer.vuejs.org
	test("string", () => {
		const ast = baseParse("hi");

		transform(ast);

		console.log("ast: ", ast);

		const { code } = codegen(ast);

		expect(code).toMatchSnapshot();
	});

	test("interpolation", () => {
		/**
         * *{{ message }}
         * import { toDisplayString as _toDisplayString } from "vue"

            export function render(_ctx, _cache, $props, $setup, $data, $options) {
            return _toDisplayString(_ctx.message)
            }
         */
		const ast = baseParse("{{ message }}");

		transform(ast, {
			nodeTransforms: [transformExpression],
		});

		console.log("ast: ", ast);

		const { code } = codegen(ast);

		expect(code).toMatchSnapshot();
	});

	test("element", () => {
		/**
         * *<div></div>
			import { openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

			export function render(_ctx, _cache, $props, $setup, $data, $options) {
				return (_openBlock(), _createElementBlock("div"))
			}
         */
		const ast = baseParse("<div></div>");

		transform(ast);

		console.log("ast: ", ast);

		const { code } = codegen(ast);

		expect(code).toMatchSnapshot();
	});

	test.only("comprehension", () => {
		/**
         * *<div>hi,{{ message }}</div>
			import { toDisplayString as _toDisplayString, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"

			export function render(_ctx, _cache, $props, $setup, $data, $options) {
			return (_openBlock(), _createElementBlock("div", null, "hi," + _toDisplayString(_ctx.message)))
			}
         */
		const ast = baseParse("<div>hi,{{ message }}</div>");

		transform(ast, {
			nodeTransforms: [transformText],
		});

		console.log("ast: ", ast);

		const { code } = codegen(ast);

		expect(code).toMatchSnapshot();
	});
});

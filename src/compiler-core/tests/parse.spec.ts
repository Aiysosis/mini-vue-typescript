import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("parse", () => {
	describe("interpolation", () => {
		test("simple interpolation", () => {
			const ast = baseParse("{{ message }}");

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.INTERPOLATION,
				content: {
					type: NodeTypes.SIMPLE_EXPRESSION,
					content: "message",
				},
			});
		});
	});

	describe("element", () => {
		test("simple element div", () => {
			const ast = baseParse("<div></div>");

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.ELEMENT,
				tag: "div",
				codegenNode: undefined,
				children: [],
			});
		});
	});

	describe("text", () => {
		test("simple text", () => {
			const ast = baseParse("some text");

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.TEXT,
				content: "some text",
			});
		});
	});

	test("hello world", () => {
		const ast = baseParse("<div>hi, {{ message }}</div>");

		expect(ast.children[0]).toStrictEqual({
			type: NodeTypes.ELEMENT,
			tag: "div",
			codegenNode: undefined,
			children: [
				{
					type: NodeTypes.TEXT,
					content: "hi, ",
				},
				{
					type: NodeTypes.INTERPOLATION,
					content: {
						type: NodeTypes.SIMPLE_EXPRESSION,
						content: "message",
					},
				},
			],
		});
	});

	test("Nested element", () => {
		const ast = baseParse("<div><p>hi, </p>{{ message }}</div>");

		expect(ast.children[0]).toStrictEqual({
			type: NodeTypes.ELEMENT,
			tag: "div",
			codegenNode: undefined,
			children: [
				{
					type: NodeTypes.ELEMENT,
					tag: "p",
					codegenNode: undefined,
					children: [
						{
							type: NodeTypes.TEXT,
							content: "hi, ",
						},
					],
				},
				{
					type: NodeTypes.INTERPOLATION,
					content: {
						type: NodeTypes.SIMPLE_EXPRESSION,
						content: "message",
					},
				},
			],
		});
	});

	it("should throw an error when lack end tag", () => {
		expect(() => {
			baseParse("<div><span></div></span>");
		}).toThrow();
	});
});

import { ElementNode, isTextNode, TextNode } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform, TransformPlugin } from "../src/transform";

describe("transform", () => {
	test("happy path", () => {
		let ast = baseParse("<div>hi,{{ message }}</div>");

		const plugin: TransformPlugin = node => {
			if (isTextNode(node)) {
				node.content = "hi,mini-vue";
			}
		};

		transform(ast, {
			nodeTransforms: [plugin],
		});

		const nodeText = (ast.children[0] as ElementNode)
			.children[0] as TextNode;

		expect(nodeText.content).toBe("hi,mini-vue");
	});
});

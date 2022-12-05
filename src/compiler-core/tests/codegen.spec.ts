import { codegen } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("codegen", () => {
	it("test", () => {
		const ast = baseParse("hi");

		transform(ast);

		console.log("ast: ", ast);

		const { code } = codegen(ast);

		expect(code).toMatchSnapshot();
	});
});

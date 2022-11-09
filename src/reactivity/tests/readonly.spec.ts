import { readOnly } from "../reactive";

describe("readonly", () => {
	it("readonly", () => {
		let origin = { foo: 10 };
		let obj = readOnly(origin);
		expect(obj).not.toBe(origin);
		expect(obj.foo).toBe(10);
	});
});

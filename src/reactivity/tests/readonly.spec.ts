import { readonly } from "../reactive";

describe("readonly", () => {
	it("readonly", () => {
		let origin = { foo: 10 };
		let obj = readonly(origin);
		expect(obj).not.toBe(origin);
		expect(obj.foo).toBe(10);
	});

	it("warn when set", () => {
		let obj = readonly({
			foo: 10,
		});

		//mock
		console.warn = vi.fn();
		obj.foo = 11;
		expect(console.warn).toBeCalled();
	});
});
import { isProxy, isReadonly, readonly } from "../reactive";

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

	it("nested reactive", () => {
		const origin = {
			nested: {
				foo: 1,
			},
			arr: [{ bar: 2 }],
		};
		const observed = readonly(origin);
		expect(isReadonly(observed)).toBe(true);
		expect(isReadonly(observed.nested)).toBe(true);
		expect(isReadonly(observed.arr)).toBe(true);
		expect(isReadonly(observed.arr[0])).toBe(true);
		expect(isProxy(origin)).toBe(false);
		expect(isProxy(observed)).toBe(true);
	});
});

import { isReadonly, shallowReadonly } from "../reactive";

describe("shallowReadonly", () => {
	it("happy path", () => {
		const origin = {
			nested: {
				foo: 1,
			},
			arr: [{ bar: 2 }],
		};
		const observed = shallowReadonly(origin);
		expect(isReadonly(observed)).toBe(true);
		expect(isReadonly(observed.nested)).toBe(false);
		expect(isReadonly(observed.arr)).toBe(false);
		expect(isReadonly(observed.arr[0])).toBe(false);
	});
});

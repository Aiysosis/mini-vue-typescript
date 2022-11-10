import { effect } from "../effect";
import { isReactive, isReadonly, reactive } from "../reactive";

describe("reactivity", () => {
	it("happy path", () => {
		let person = { age: 10 };
		let personRef = reactive(person);
		expect(personRef).not.toBe(person);
		expect(personRef.age).toBe(10);

		expect(isReactive(personRef)).toBe(true);
		expect(isReactive(person)).toBe(false);
		expect(isReadonly(personRef)).toBe(false);
		expect(isReadonly(person)).toBe(false);
	});

	it("nested reactive", () => {
		const origin = {
			nested: {
				foo: 1,
			},
			arr: [{ bar: 2 }],
		};
		const observed = reactive(origin);
		expect(isReactive(observed)).toBe(true);
		expect(isReactive(observed.nested)).toBe(true);
		expect(isReactive(observed.arr)).toBe(true);
		expect(isReactive(observed.arr[0])).toBe(true);

		let dummy: any;
		let runner = effect(() => {
			dummy = observed.arr[0].bar;
		});
		expect(dummy).toBe(2);
		observed.arr[0].bar++;
		expect(dummy).toBe(3);
	});
});

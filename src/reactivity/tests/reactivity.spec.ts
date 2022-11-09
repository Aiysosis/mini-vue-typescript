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
});

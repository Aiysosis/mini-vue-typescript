import { reactive } from "../reactive";

describe("reactivity", () => {
	it("happy path", () => {
		let person = { age: 10 };
		let personRef = reactive(person);
		expect(personRef).not.toBe(person);
		expect(personRef.age).toBe(10);
	});
});

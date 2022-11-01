import { effect } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
	it("happy path", () => {
		const user = reactive({ age: 10 });

		let nextAge;
		effect(() => {
			nextAge = user.age + 1;
		});
		expect(nextAge).toBe(11);

		user.age++;
		expect(nextAge).toBe(12);

		//test if effect only run once
		user.age++;
		expect(nextAge).toBe(13);
	});

	it("runner", () => {
		let foo = 10;

		const runner = effect(() => {
			foo++;
			return "foo";
		});

		expect(foo).toBe(11); //调用effect立即执行一次

		let res = runner(); //调用runner

		expect(foo).toBe(12);
		expect(res).toBe("foo");
	});
});

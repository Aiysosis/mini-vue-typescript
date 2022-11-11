import { effect } from "../effect";
import { reactive } from "../reactive";
import { isRef, ref, unRef } from "../ref";

describe("ref", () => {
	it("happy path", () => {
		const a = ref(1);
		expect(a.value).toBe(1);
	});

	it("should be reactive", () => {
		const a = ref(1);
		let dummy;
		let calls = 0;
		effect(() => {
			calls++;
			dummy = a.value;
		});
		expect(calls).toBe(1);
		expect(dummy).toBe(1);
		a.value = 2;
		expect(calls).toBe(2);
		expect(dummy).toBe(2);
		a.value = 2; //值不变不引起依赖触发
		expect(calls).toBe(2);
		expect(dummy).toBe(2);
	});

	it("should make nested properties reactive", () => {
		const a = ref({
			foo: 1,
			bar: {
				baz: 1,
			},
		});
		let dummy;
		let calls = 0;
		effect(() => {
			calls++;
			dummy = a.value.bar.baz;
		});
		expect(dummy).toBe(1);
		expect(calls).toBe(1);
		a.value.bar.baz++;
		expect(dummy).toBe(2);
		expect(calls).toBe(2);
		a.value.bar.baz = 100;
		expect(dummy).toBe(100);
		expect(calls).toBe(3);
	});

	it("isRef", () => {
		let a = ref(1);
		let person = reactive({
			age: 10,
		});
		expect(isRef(a)).toBe(true);
		expect(isRef(1)).toBe(false);
		expect(isRef(person)).toBe(false);
	});

	it("unRef", () => {
		let a = ref(1);
		expect(unRef(a)).toBe(1);
		expect(unRef(1)).toBe(1);
	});
});

import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
	it("happy path", () => {
		//和ref非常类似
		//独特的缓存功能(happy path中没有体现)
		const user = reactive({
			age: 10,
		});

		const age = computed(() => {
			return user.age;
		});

		expect(age.value).toBe(10);
	});

	it("shoule compute lazily", () => {
		const value = reactive({
			foo: 1,
		});

		const getter = vi.fn(() => {
			return value.foo;
		});

		const cValue = computed(getter);

		//lazy
		expect(getter).not.toHaveBeenCalled();
		expect(cValue.value).toBe(1);
		expect(getter).toHaveBeenCalledTimes(1);

		//should not compute again
		cValue.value;
		expect(getter).toHaveBeenCalledTimes(1);

		//shoule not compute
		value.foo = 2;
		expect(getter).toHaveBeenCalledTimes(1);

		//should compute when need
		expect(cValue.value).toBe(2);
		expect(getter).toHaveBeenCalledTimes(2);
	});
});

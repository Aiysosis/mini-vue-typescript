import { effect } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
	/**
	 * 最基本的特性，通过reactive绑定依赖&触发依赖
	 * 通过effect收集依赖
	 * 涉及函数：
	 * reactive->track->trigger
	 * effect->activeEffect
	 */
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

	/**
	 * runner特性,在effect初始化的时候返回runner函数
	 * （其实就是传入的函数，但是this指向被改变了）
	 */
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

	it("scheduler", () => {
		let dummy;
		let run: any;
		const scheduler = vi.fn(() => {
			run = runner;
		});
		const obj = reactive({ foo: 1 });
		const runner = effect(
			() => {
				dummy = obj.foo;
			},
			{ scheduler }
		);
		expect(scheduler).not.toHaveBeenCalled();
		expect(dummy).toBe(1);
		// should be called on first trigger
		obj.foo++;
		expect(scheduler).toHaveBeenCalledTimes(1);
		// // should not run yet
		expect(dummy).toBe(1);
		// // manually run
		run();
		// // should have run
		expect(dummy).toBe(2);
	});
});

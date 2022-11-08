import { effect, stop } from "../effect";
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

	/**
	 * scheduler特性：允许用户在参数中传入一个scheduler函数,
	 * 初始化时仍然调用run方法，但是之后依赖触发时调用scheduler。
	 */
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
		expect(scheduler).not.toHaveBeenCalled(); //scheduler初始化时不调用
		expect(dummy).toBe(1); //初始化时调用处理函数
		// should be called on first trigger
		obj.foo++;
		expect(scheduler).toHaveBeenCalledTimes(1); //更新时调用scheduler
		// // should not run yet
		expect(dummy).toBe(1);
		// // manually run
		run();
		// // should have run
		expect(dummy).toBe(2);
	});

	/**
	 * stop函数接受runner，可以在依赖触发时进行阻止
	 * 我们只要在stop调用时找到runner对应的effect，
	 * 把它从deps中删除，这样后续的更新就不会再被触发，
	 * 而runner的调用时不受影响的。
	 */
	it("stop", () => {
		let dummy;
		const obj = reactive({ prop: 1 });
		const runner = effect(() => {
			dummy = obj.prop;
		});
		obj.prop = 2;
		expect(dummy).toBe(2);
		stop(runner); //阻止runner运行
		obj.prop = 3; //如果是obj.prop++ 那么直接报错
		expect(dummy).toBe(2);

		// stopped effect should still be manually callable
		runner();
		expect(dummy).toBe(3);
	});
});

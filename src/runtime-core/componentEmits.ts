import { camelize, isFunction, toHandlerKey } from "@/shared/index";
import { ComponentInstance } from "./component";

export function emit(
	instance: ComponentInstance,
	event: string,
	...args: any[]
) {
	const { props } = instance;

	//* event 可以使用不同的命名方式：
	//* add -> onAdd (使用 on + 事件名)
	//* add-foo => addFoo （使用烤肉串命名）

	const handler = props[toHandlerKey(camelize(event))];

	if (handler && isFunction(handler)) {
		handler(...args);
	}
}

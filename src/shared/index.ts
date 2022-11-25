export const extend = Object.assign;

export const isArray = Array.isArray;

export const isMap = (val: unknown): val is Map<any, any> =>
	toTypeString(val) === "[object Map]";

export const isSet = (val: unknown): val is Set<any> =>
	toTypeString(val) === "[object Set]";

export const isDate = (val: unknown): val is Date =>
	toTypeString(val) === "[object Date]";

export const isFunction = (val: unknown): val is Function =>
	typeof val === "function";

export const isString = (val: unknown): val is string =>
	typeof val === "string";

export const isSymbol = (val: unknown): val is symbol =>
	typeof val === "symbol";

export const isObject = (val: unknown): val is Record<any, any> =>
	val !== null && typeof val === "object";

export const objectToString = Object.prototype.toString;
export const toTypeString = (value: unknown): string =>
	objectToString.call(value);

export const hasChanged = (newValue: any, oldValue: any) =>
	!Object.is(newValue, oldValue);

/**
 * 首字母大写
 * @param str
 * @returns
 */
export const captalize = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * foo -> onFoo
 * foo-bar -> onFooBar
 * @param str
 * @returns
 */
export const toHandlerKey = (str: string) => {
	return str ? "on" + captalize(str) : "";
};

/**
 * 烤肉串转驼峰
 * @param str
 * @returns
 */
export const camelize = (str: string) => {
	return str.replace(/-(\w)/g, (_, c: string) => {
		return c ? c.toUpperCase() : "";
	});
};

import { baseCompile } from "./compiler-core";
import * as vue from "./runtime-dom/index";
import { registerRuntimeComplier } from "./runtime-dom/index";

export * from "./runtime-dom/index";
export * from "./reactivity/index";

export function compilerToFunction(template: string) {
	const { code } = baseCompile(template);

	const render = new Function("vue", code)(vue);

	return render;
}

registerRuntimeComplier(compilerToFunction);

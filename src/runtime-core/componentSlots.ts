import { isArray } from "@/shared/index";
import { ShapeFlags } from "@/shared/shapeFlags";
import { ComponentInstance } from "./component";

export type Slots = {
	[name: string]: unknown;
};

export function initSlots(instance: ComponentInstance) {
	if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
		const children = instance.vnode.children as Slots;
		//* children:object
		instance.slots = {};
		for (const key in children) {
			instance.slots[key] = normalizeSlotsValue(children[key]);
		}
	}
}

function normalizeSlotsValue(val: any) {
	return isArray(val) ? val : [val];
}

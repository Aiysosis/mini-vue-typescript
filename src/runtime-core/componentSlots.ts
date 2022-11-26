import { isArray } from "@/shared/index";
import { ShapeFlags } from "@/shared/shapeFlags";
import { ComponentInstance } from "./component";
import { VNode } from "./vnode";

export type Slot = (...args: any[]) => VNode[];

export type InternalSlots = {
	[name: string]: Slot | undefined;
};

export type Slots = Readonly<InternalSlots>;

export type RawSlots = {
	[name: string]: Function;
};

export function initSlots(instance: ComponentInstance) {
	if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
		const children = instance.vnode.children as RawSlots;
		//* children: function
		instance.slots = {};
		for (const key in children) {
			const val = children[key];
			instance.slots[key] = (...args: any[]) =>
				normalizeSlotsValue(val(...args));
		}
	}
}

function normalizeSlotsValue(val: any) {
	return isArray(val) ? val : [val];
}

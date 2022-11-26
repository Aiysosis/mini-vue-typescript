import { Slots } from "../componentSlots";
import { createVNode } from "../vnode";

export function renderSlots(slots: Slots, key: string) {
	const slot = slots[key];
	if (slot) {
		return createVNode("div", {}, slot);
	}
}

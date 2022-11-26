import { Slots } from "../componentSlots";
import { createVNode } from "../vnode";

export function renderSlots(slots: Slots, key: string, props: object) {
	const slot = slots[key];
	if (slot) {
		return createVNode("div", {}, slot(props));
	}
}

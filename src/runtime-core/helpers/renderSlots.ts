import { Slots } from "../componentSlots";
import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots: Slots, key: string, props: object) {
	const slot = slots[key];
	if (slot) {
		return createVNode(Fragment, {}, slot(props));
	}
}

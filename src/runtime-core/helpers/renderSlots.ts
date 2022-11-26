import { Slots } from "../componentSlots";

export function renderSlots(slots: Slots, key: string) {
	const slot = slots[key];
	if (slot) return slot;
}

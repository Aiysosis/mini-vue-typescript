import { ComponentInstance } from "./component";

export function initProps(instance: ComponentInstance) {
	instance.props = instance.vnode.props || {};
}

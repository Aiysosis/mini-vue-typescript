import { Component } from "@/runtime-core/component";
import {
	createRenderer,
	Invoker,
	RendererNode,
	RendererOptions,
} from "@/runtime-core/renderer";

type DomElement = Element & {
	_vei?: Record<string, Invoker | undefined>;
};
type DomNode = Node;

const shouldSetAsProps = (el: DomElement, key: string, value: any) => {
	//特殊处理
	if (key === "form" && el.tagName === "input") return false;
	//兜底
	return key in el;
};
const domInterfaceImplement: RendererOptions<DomNode, DomElement> = {
	patchProp(el, key, prevValue, nextValue) {
		if (!nextValue) {
			el.removeAttribute(key);
		} else if (prevValue !== nextValue) {
			//* 分情况讨论
			const type = typeof el[key];

			//* 事件处理
			//? 约定以 on开头的属性都视为事件（onclick,onMouseover...）
			//? vue 中的 @click 之类的都是 onclick 的语法糖
			if (/^on/.test(key)) {
				//? 如果直接添加事件，删除事件会很麻烦，可以用一个变量把处理函数记录下来
				const invokers = el._vei || (el._vei = {}); //* vue event invoker
				const eventName = key.slice(2).toLowerCase();
				//? invoker 自身是一个函数，但是它的value属性才是真正的事件处理函数，自己相当于proxy
				let invoker = invokers[key];
				if (nextValue) {
					//* nextValue: Function | Function[]
					if (!invoker) {
						//* 缓存
						//invoker 是带有属性value的函数，它的value是缓存的事件处理函数
						invoker = ((e: any) => {
							//* 依次调用处理函数
							if (Array.isArray(invoker.value)) {
								for (const fn of invoker.value) {
									fn(e);
								}
							} else {
								invoker.value(e);
							}
						}) as Invoker;

						invoker.value = nextValue;
						//保存
						invokers[key] = invoker;
						el._vei = invokers;
						el.addEventListener(eventName, invoker);
					} else {
						//* 有 invoker 直接覆盖原有的
						invoker.value = nextValue;
					}
				} else if (invoker) {
					//* 如果没有处理函数，且invoker存在，那么要清空
					el.removeEventListener(eventName, invoker);
					//bug 不一定正确
					invokers[key] = undefined;
				}
			}
			//? class 使用el.className 兼容 + 提速
			else if (key === "class") {
				el.className = nextValue || "";
			} else if (shouldSetAsProps(el, key, nextValue)) {
				//* 要设置的属性是 DOM Properties
				//? 只有属性名的情况 例如 buttn 按钮的 disable
				if (type === "boolean" && nextValue === "") {
					el[key] = true;
				} else {
					//* 一般情形
					el[key] = nextValue;
				}
			} else {
				//* 设置的属性没有对应的 DOM Properties, 使用 setAttribute
				el.setAttribute(key, nextValue);
			}
		}
	},
	insert(el, parent, anchor?) {
		parent.insertBefore(el, anchor || null);
	},
	remove(el) {
		const parent = el.parentNode;
		if (parent) {
			parent.removeChild(el);
		}
	},
	createElement(type) {
		return document.createElement(type);
	},
	createText(text) {
		return document.createTextNode(text);
	},
	setText(node, text) {},
	setElementText(node, text) {
		node.textContent = text;
	},
};

export const renderer = createRenderer(domInterfaceImplement);

export function createApp(app: Component) {
	return renderer.createApp(app);
}

export * from "../runtime-core/index";

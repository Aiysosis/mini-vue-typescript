const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isObject = (val) => val !== null && typeof val === "object";
/**
 * 首字母大写
 * @param str
 * @returns
 */
const captalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
/**
 * foo -> onFoo
 * foo-bar -> onFooBar
 * @param str
 * @returns
 */
const toHandlerKey = (str) => {
    return str ? "on" + captalize(str) : "";
};
/**
 * 烤肉串转驼峰
 * @param str
 * @returns
 */
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};

const targetMap = new WeakMap();
/**
 *
 * @param target 对象
 * @param key 属性名
 */
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    //如果有scheduler那么运行scheduler，否则运行run
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (let effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_is_reactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_is_readonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow)
            return res;
        if (isObject(res))
            return isReadonly ? readonly(res) : reactive(res);
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`key[${key}] is not assignable because it's readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function createReactiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    //* event 可以使用不同的命名方式：
    //* add -> onAdd (使用 on + 事件名)
    //* add-foo => addFoo （使用烤肉串命名）
    const handler = props[toHandlerKey(camelize(event))];
    if (handler && isFunction(handler)) {
        handler(...args);
    }
}

function initProps(instance) {
    instance.props = instance.vnode.props || {};
}

//* 新增的属性修改这里即可
const publicProprietiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots,
};
const hasOwn = (obj, key) => obj && Object.prototype.hasOwnProperty.apply(obj, [key]);
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        //* target是ctx，它的 _ 属性是instance，使用解构赋值然后重命名
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        if (hasOwn(props, key)) {
            return props[key];
        }
        const getter = publicProprietiesMap[key];
        if (getter) {
            return getter(instance);
        }
        //* 兜底
        return undefined;
    },
};

function initSlots(instance) {
    if (instance.vnode.shapeFlag & 32 /* ShapeFlags.SLOTS_CHILDREN */) {
        const children = instance.vnode.children;
        //* children: function
        instance.slots = {};
        for (const key in children) {
            const val = children[key];
            instance.slots[key] = (...args) => normalizeSlotsValue(val(...args));
        }
    }
}
function normalizeSlotsValue(val) {
    return isArray(val) ? val : [val];
}

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: {},
        setupState: {},
        emit: () => { },
        slots: {},
    };
    //* 这里用了一个小 trick ，使用 bind函数来提前输入一些内部的参数，这样用户调用的时候就轻松很多
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    initProps(instance);
    initSlots(instance);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    //*创建 proxy
    const ctx = { _: instance };
    instance.proxy = new Proxy(ctx, PublicInstanceProxyHandlers);
    //* 处理 setup函数
    if (component.setup) {
        //* currentInstance 只在setup函数调用的时候可以被读取
        setCurrentInstance(instance);
        const setupResult = component.setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
        //extends(setupResult,instance.props)
    }
    //* finish setup
    //* 把 render函数放入instance中
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    const render = component.render;
    if (render) {
        //* 绑定 this
        instance.render = render.bind(instance.proxy);
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props = null, children = null) {
    //todo createVNode
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag: initShapeFlag(type),
    };
    if (children) {
        vnode.shapeFlag |= isString(children)
            ? 8 /* ShapeFlags.TEXT_CHILDREN */
            : isArray(children)
                ? 16 /* ShapeFlags.ARRAY_CHILDREN */
                : isObject(children)
                    ? 32 /* ShapeFlags.SLOTS_CHILDREN */
                    : 0;
    }
    return vnode;
}
function initShapeFlag(type) {
    if (typeof type === "string") {
        return 1 /* ShapeFlags.ELEMENT */;
    }
    else {
        return 4 /* ShapeFlags.STATEFUL_COMPONENT */;
    }
}
const h = createVNode;
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function renderSlots(slots, key, props) {
    const slot = slots[key];
    if (slot) {
        return createVNode(Fragment, {}, slot(props));
    }
}

function createRenderer(options) {
    const { patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, createElement: hostCreateElement, createText: hostCreateText, setText: hostSetText, setElementText: hostSetElementText, } = options;
    const shouldSetAsProps = (el, key, value) => {
        //特殊处理
        if (key === "form" && el.tagName === "input")
            return false;
        //兜底
        return key in el;
    };
    const patchProps = (el, key, prevValue, nextValue) => {
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
                    invoker = ((e) => {
                        //* 依次调用处理函数
                        if (Array.isArray(invoker.value)) {
                            for (const fn of invoker.value) {
                                fn(e);
                            }
                        }
                        else {
                            invoker.value(e);
                        }
                    });
                    invoker.value = nextValue;
                    //保存
                    invokers[key] = invoker;
                    el._vei = invokers;
                    el.addEventListener(eventName, invoker);
                }
                else {
                    //* 有 invoker 直接覆盖原有的
                    invoker.value = nextValue;
                }
            }
            else if (invoker) {
                //* 如果没有处理函数，且invoker存在，那么要清空
                el.removeEventListener(eventName, invoker);
                //bug 不一定正确
                invokers[key] = undefined;
            }
        }
        //? class 使用el.className 兼容 + 提速
        else if (key === "class") {
            el.className = nextValue || "";
        }
        else if (shouldSetAsProps(el, key)) {
            //* 要设置的属性是 DOM Properties
            //? 只有属性名的情况 例如 buttn 按钮的 disable
            if (type === "boolean" && nextValue === "") {
                el[key] = true;
            }
            else {
                //* 一般情形
                el[key] = nextValue;
            }
        }
        else {
            //* 设置的属性没有对应的 DOM Properties, 使用 setAttribute
            el.setAttribute(key, nextValue);
        }
    };
    function processElement(n1, n2, container) {
        if (!n1) {
            mountElement(n2, container);
        }
    }
    function processFragment(n1, n2, container) {
        if (!n1) {
            mountChildren(n2, container);
        }
    }
    function processText(n1, n2, container) {
        if (!n1) {
            const children = n2.children;
            const textNode = (n2.el = hostCreateText(children));
            hostInsert(textNode, container);
        }
    }
    const patch = (n1, n2, container) => {
        //* 两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
        //* 如果新旧的 tagName 不一样，那么直接卸载旧的，然后挂新的上去
        if (n1 && n1.type !== n2.type) {
            n1 = null;
        }
        const { type } = n2;
        switch (type) {
            //* Fragment 类型，只有children
            case Fragment:
                processFragment(n1, n2, container);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (n2.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container);
                }
                else if (n2.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container);
                }
                else ;
        }
    };
    function mountElement(vnode, container) {
        //* create element
        const { type, shapeFlag, props, children } = vnode;
        const el = hostCreateElement(type);
        //* 引用实际的 dom 元素，用于后续的卸载操作 -> unmount, 以及组件的 this.$el
        vnode.el = el;
        //* process props
        if (props) {
            for (const key in props) {
                patchProps(el, key, null, props[key]);
            }
        }
        //* process children
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            //* 直接更新文本内容
            hostSetElementText(el, children);
        }
        else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            //* child is vnode
            //* 递归调用，以自己为挂载点
            mountChildren(vnode, el);
            // (children as VNode[]).forEach(node => {
            // 	//* child 也可能是组件，所以重新调用 patch
            // 	patch(null, node, el);
            // });
        }
        //* insert
        hostInsert(el, container);
    }
    function mountChildren(vnode, container) {
        const children = vnode.children;
        children.forEach(node => {
            patch(null, node, container);
        });
    }
    function processComponent(n1, n2, container) {
        if (!n1) {
            mountComponent(n2, container);
        }
    }
    // 组件挂载
    function mountComponent(vnode, container) {
        const instance = createComponentInstance(vnode);
        //* 这一步初始化了Props，slots，setup函数，
        //* component proxy
        setupComponent(instance);
        //* 真正的渲染
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        //* 调用组件的render函数以获取vnode，然后挂载
        const subTree = instance.render();
        patch(null, subTree, container);
        //* 这一步很关键，patch中设置的 el是为subTree节点设置的，这里还要再次赋值
        instance.vnode.el = subTree.el;
    }
    function unmount(vnode) {
        //todo 调用生命周期函数 or 钩子函数
        //todo 主要逻辑
    }
    const render = (vnode, container) => {
        if (vnode) {
            //* 有 vnode，进行patch操作
            patch(container._vnode || null, vnode, container);
        }
        else {
            //* 没有 vnode，卸载节点
            unmount(container._vnode);
        }
        //* 无论什么操作，都更新 _vnode
        container._vnode = vnode;
    };
    return {
        render,
    };
}
const domInterfaceImplement = {
    patchProp(el, key, prevValue, nextValue) { },
    insert(el, parent, anchor) {
        parent.appendChild(el);
    },
    remove(el) { },
    createElement(type) {
        return document.createElement(type);
    },
    createText(text) {
        return document.createTextNode(text);
    },
    setText(node, text) { },
    setElementText(node, text) {
        node.textContent = text;
    },
};
const renderer = createRenderer(domInterfaceImplement);

function createApp(app) {
    //todo createApp
    return {
        mount: (rootContainer) => {
            //* 基于组件创建虚拟节点
            const vnode = createVNode(app);
            //* 进行渲染操作
            renderer.render(vnode, rootContainer);
        },
    };
}

export { createApp, createTextVNode, getCurrentInstance, h, renderSlots };
//# sourceMappingURL=aiyso-vue.esm.js.map

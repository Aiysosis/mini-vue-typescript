const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isObject = (val) => val !== null && typeof val === "object";
const hasChanged = (newValue, oldValue) => !Object.is(newValue, oldValue);
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
const EMPTY_OBJ = {};

const targetMap = new WeakMap();
let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, options) {
        this.active = true; //用于实现只stop一次
        this._fn = fn;
        extend(this, options);
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        return res;
    }
    stop() {
        if (this.active) {
            //不需要反复清理
            cleanupEffect(this);
            this.active = false;
            if (this.onStop) {
                this.onStop();
            }
        }
    }
}
function cleanupEffect(effect) {
    if (!effect.deps)
        return;
    for (let dep of effect.deps) {
        dep.delete(effect);
    }
    effect.deps.length = 0; //直接清空deps
}
/**
 *
 * @param target 对象
 * @param key 属性名
 */
//这里的key使用了string，symbol的情况就没有考虑了
function track(target, key) {
    /*if (!activeEffect.active) return;这样是不安全的，虽然可以通过相关测试
      因为activeEffect是公共的变量，如果创建了两个effect，然后stop第一个，那么一定会出问题
     */
    //stop之后就不需要track了，所以判断shouldTrack
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    if (!activeEffect.deps)
        activeEffect.deps = [];
    activeEffect.deps.push(dep);
}
const isTracking = () => activeEffect && shouldTrack;
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
function effect(fn, options = {}) {
    let _effect = new ReactiveEffect(fn, options);
    //直接用runner去比对会浪费性能，可以runner中的this指向_effect，这样可以更方便操作
    //为此需要定义类型
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    _effect.run();
    return runner;
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
        if (!isReadonly)
            track(target, key);
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
const isReactive = (val) => !!val["__v_is_reactive" /* ReactiveFlags.IS_REACTIVE */];
const toReactive = (value) => {
    let val = value;
    return isObject(val) ? reactive(val) : value;
};

class RefImpl {
    constructor(val) {
        this.dep = undefined;
        this.__v_is_ref = true;
        this._rawValue = val;
        this._value = toReactive(val);
    }
    get value() {
        let res = this._value;
        trackRefValue(this);
        return res;
    }
    set value(newValue) {
        if (!hasChanged(newValue, this._rawValue))
            return;
        this._rawValue = newValue;
        this._value = toReactive(newValue);
        if (this.dep)
            triggerEffects(this.dep);
    }
}
function trackRefValue(ref) {
    if (!ref.dep)
        ref.dep = new Set();
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
//TODO ref的嵌套实现（需要将内层的ref变成普通对象/值）
function ref(raw) {
    return new RefImpl(raw);
}
const isRef = (val) => !!val.__v_is_ref;
// export const unRef = (val: any) => (isRef(val) ? val.value : val);
function unRef(val) {
    if (isRef(val)) {
        return unRef(val.value);
    }
    else {
        return val;
    }
}
function proxyRefs(val) {
    return new Proxy(val, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else
                return Reflect.set(target, key, value);
        },
    });
}

class computedImpl {
    constructor(getter) {
        this._dirty = true;
        this._getter = getter;
        this._effect = new ReactiveEffect(this._getter, {
            scheduler: () => {
                if (!this._dirty)
                    this._dirty = true;
            },
        });
    }
    get value() {
        if (this._dirty) {
            this._value = this._effect.run();
            this._dirty = false;
        }
        return this._value;
    }
}
function computed(fn) {
    return new computedImpl(fn);
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
        props: null,
        setupState: null,
        proxy: null,
        emit: null,
        slots: null,
        isMounted: false,
        subTree: null, //+ will be set after creation
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
        instance.setupState = proxyRefs(setupResult);
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
        key: props === null || props === void 0 ? void 0 : props.key,
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

function createAppAPI(render) {
    return function createApp(app) {
        return {
            mount: (rootContainer) => {
                //* 基于组件创建虚拟节点
                const vnode = createVNode(app);
                //* 进行渲染操作
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, createElement: hostCreateElement, createText: hostCreateText, setText: hostSetText, setElementText: hostSetElementText, } = options;
    //@fn patchProps
    const patchProps = (el, 
    // key: string,
    vnode, oldProps, newProps) => {
        if (oldProps !== newProps) {
            console.log("[patchProps]: update", newProps);
            for (const key in newProps) {
                const oldValue = oldProps[key];
                const newValue = newProps[key];
                hostPatchProp(el, key, oldValue, newValue);
            }
            //* 少的属性要进行删除
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    };
    //@fn processElement
    function processElement(n1, n2, container, anchor) {
        if (!n1) {
            mountElement(n2, container, anchor);
        }
        else {
            patchElement(n1, n2, container, anchor);
        }
    }
    function patchElement(n1, n2, container, anchor) {
        console.log("[patchElement]: patch");
        //! 重要的细节：n2 上此时是没有el的
        const el = (n2.el = n1.el);
        //* patch children
        patchChildren(n1, n2, container, anchor);
        //* patch props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        patchProps(el, n2, oldProps, newProps);
    }
    //@fn patchCildren
    function patchChildren(n1, n2, container, parentAnchor) {
        //* 这里默认 n1,n2 都不为null
        // children类型： text or Array 共有四种组合
        if (n2.shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            if (n1.shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                //* array -> text: 先 unmount array，然后挂载text
                unmountChildren(n1.children);
                hostSetElementText(container, n2.children);
            }
            else {
                //* text -> text
                if (n1.children !== n2.children) {
                    hostSetElementText(container, n2.children);
                }
            }
        }
        else {
            if (n1.shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                //* text -> array 先清空text 再挂载
                hostSetElementText(container, "");
                mountChildren(n2.children, container);
            }
            else {
                patchKeyedChildren(n1.children, n2.children, container, parentAnchor);
            }
        }
    }
    function isSameVNode(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    //@fn diff algorithm
    function patchKeyedChildren(c1, c2, container, parentAnchor) {
        //? key should always exists in this condition
        let i = 0, e1 = c1.length - 1, e2 = c2.length - 1;
        //* 从左往右
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNode(n1, n2)) {
                patch(n1, n2, container, parentAnchor); //递归地对比
            }
            else
                break;
            i++;
        }
        //* 从右往左
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNode(n1, n2)) {
                patch(n1, n2, container, parentAnchor);
            }
            else
                break;
            e1--;
            e2--;
        }
        //* 根据 i,e1,e2 的位置分情况讨论
        console.log("test");
        if (i > e1) {
            if (i <= e2) {
                //*此时 [i,e2] 的节点是新节点, 且只有添加的操作
                const nextPos = e2 + 1;
                const anchor = nextPos >= c2.length ? null : c2[nextPos].el;
                for (let j = i; j <= e2; j++) {
                    patch(null, c2[j], container, anchor);
                }
            }
        }
        else if (i > e2) {
            if (i <= e1) {
                //*此时 [i,e1] 的节点是要删除的节点，对他们进行删除操作即可
                for (let j = i; j <= e1; j++) {
                    hostRemove(c1[j].el);
                }
            }
        }
        else {
            //* 中间对比，需要遍历，通过哈希表降低时间复杂度
            const toBePatched = e2 - i + 1;
            const initalPos = i;
            let patched = 0;
            const keyToNewIndexMap = new Map(); //key to new index
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            //* 将新的节点放入map
            for (let j = i; j <= e2; j++) {
                const nextChild = c2[j];
                keyToNewIndexMap.set(nextChild.key, j);
            }
            for (let j = i; j <= e1; j++) {
                const prevChild = c1[j];
                let nextChildIdx = undefined;
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                if (prevChild.key) {
                    //* 如果有key，那么就在 map中搜索
                    nextChildIdx = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    //* 可能某个元素没有 key 这一属性，所以只能靠遍历来判断是否还在序列之中
                    for (let k = i; k <= e2; k++) {
                        if (isSameVNode(prevChild, c2[k])) {
                            nextChildIdx = k;
                            break;
                        }
                    }
                }
                if (nextChildIdx) {
                    //* 找到了 -> 更新
                    patch(prevChild, c2[nextChildIdx], container);
                    //? c1[j] = prevChild; c2[nextChildIdx] = nextChild;
                    newIndexToOldIndexMap[nextChildIdx - initalPos] = j + 1;
                    patched++;
                }
                else {
                    //* 没找到 -> 删除prevChild
                    hostRemove(prevChild.el);
                }
                //* 还要检查是否有多的 nextChild
            }
            const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
            console.log("[newIndexToOldIndexMap]", newIndexToOldIndexMap, " has a increasing sub sequence ", increasingNewIndexSequence);
            let k = increasingNewIndexSequence.length - 1;
            let anchor = e2 + 1 >= c2.length ? null : c2[e2 + 1].el;
            for (let j = toBePatched - 1; j >= 0; j--) {
                if (j === increasingNewIndexSequence[k]) {
                    //* 节点位置没有改变，正常遍历
                    k--;
                    //* 此时这个节点位置固定了，它变成了新的锚点
                    anchor = c2[j + initalPos].el;
                }
                else {
                    //* 节点位置发生改变，需要将节点插入到锚点处
                    let currentElement = c2[j + initalPos].el;
                    hostInsert(currentElement, container, anchor);
                    //* 这个节点位置固定，它作为新的锚点
                    anchor = currentElement;
                }
            }
        }
    }
    function processFragment(n1, n2, container) {
        if (!n1) {
            mountChildren(n2.children, container);
        }
    }
    function processText(n1, n2, container) {
        if (!n1) {
            const children = n2.children;
            const textNode = (n2.el = hostCreateText(children));
            hostInsert(textNode, container);
        }
    }
    //@fn patch
    const patch = (n1, n2, container, anchor) => {
        //* 两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
        //* 如果新旧的 tagName 不一样，那么直接卸载旧的，然后挂新的上去
        if (n1 && n1.type !== n2.type) {
            unmount(n1);
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
                    processElement(n1, n2, container, anchor);
                }
                else if (n2.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container);
                }
                else ;
        }
    };
    //@fn mountElment
    function mountElement(vnode, container, anchor) {
        //* create element
        const { type, shapeFlag, props, children } = vnode;
        const el = hostCreateElement(type);
        //* 引用实际的 dom 元素，用于后续的卸载操作 -> unmount, 以及组件的 this.$el
        vnode.el = el;
        //* process props
        if (props) {
            patchProps(el, vnode, EMPTY_OBJ, props);
        }
        //* process children
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            //* 直接更新文本内容
            hostSetElementText(el, children);
        }
        else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
            //* child is vnode
            //* 递归调用，以自己为挂载点
            mountChildren(vnode.children, el);
            // (children as VNode[]).forEach(node => {
            // 	//* child 也可能是组件，所以重新调用 patch
            // 	patch(null, node, el);
            // });
        }
        //* insert
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container) {
        children.forEach(node => {
            patch(null, node, container);
        });
    }
    function unmountChildren(children) {
        for (const child of children) {
            hostRemove(child.el);
        }
    }
    //@fn processComponent
    function processComponent(n1, n2, container) {
        if (n1 === null) {
            mountComponent(n2, container);
        }
        else {
            //+ 本次流程不会涉及
            patchComponent();
        }
    }
    // 组件挂载 @fn mountComponent
    function mountComponent(vnode, container) {
        const instance = createComponentInstance(vnode);
        //* 这一步初始化了Props，slots，setup函数，
        //* component proxy
        setupComponent(instance);
        //* 真正的渲染 + effect
        setupRenderEffect(instance, container);
    }
    //+ 在这里使用 effect @fn setupRendereffect
    function setupRenderEffect(instance, container) {
        effect(() => {
            //* 调用组件的render函数以获取vnode，然后挂载
            if (!instance.isMounted) {
                const subTree = (instance.subTree = instance.render());
                patch(null, subTree, container);
                //! 这一步很关键，patch中设置的 el是为subTree节点设置的，这里还要再次赋值
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("[setupRenderEffect]: update");
                //* 拿到新的 subtree
                //* 这里是由 effect触发的，而 proxy的绑定在setupComponent中，所以需要再次绑定
                const subTree = instance.render.call(instance.proxy);
                const prevSubTree = instance.subTree;
                console.log("prev: ", prevSubTree);
                console.log("current", subTree);
                //! 这里第三个参数一定不能使用container，这里的 container是闭包里面的 container，是顶层容器, 真正用于更新的是 el
                patch(prevSubTree, subTree, prevSubTree.el);
            }
        });
    }
    function patchComponent(n1, n2, container) {
        console.log("[Patch component]: patch");
    }
    function unmount(vnode) {
        //todo 调用生命周期函数 or 钩子函数
        hostRemove(vnode.el);
    }
    //@fn render
    const render = (vnode, container) => {
        if (vnode) {
            //* 有 vnode，进行patch操作
            patch(container._vnode || null, vnode, container);
        }
        else {
            //* 没有 vnode，卸载节点
            unmount(container._vnode);
        }
        //+ 无论什么操作，都更新 _vnode
        container._vnode = vnode;
    };
    return {
        createApp: createAppAPI(render),
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function renderSlots(slots, key, props) {
    const slot = slots[key];
    if (slot) {
        return createVNode(Fragment, {}, slot(props));
    }
}

const shouldSetAsProps = (el, key, value) => {
    //特殊处理
    if (key === "form" && el.tagName === "input")
        return false;
    //兜底
    return key in el;
};
const domInterfaceImplement = {
    patchProp(el, key, prevValue, nextValue) {
        if (!nextValue) {
            el.removeAttribute(key);
        }
        else if (prevValue !== nextValue) {
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
        }
    },
    insert(el, parent, anchor) {
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
    setText(node, text) { },
    setElementText(node, text) {
        node.textContent = text;
    },
};
const renderer = createRenderer(domInterfaceImplement);
function createApp(app) {
    return renderer.createApp(app);
}

export { computed, createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, isReactive, isRef, proxyRefs, reactive, ref, renderSlots, renderer };
//# sourceMappingURL=aiyso-vue.esm.js.map

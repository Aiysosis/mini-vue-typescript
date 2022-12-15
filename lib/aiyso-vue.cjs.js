'use strict';

function toDisplayString(val) {
    return String(val);
}

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

var NodeTypes;
(function (NodeTypes) {
    NodeTypes[NodeTypes["ROOT"] = 0] = "ROOT";
    NodeTypes[NodeTypes["TEXT"] = 1] = "TEXT";
    NodeTypes[NodeTypes["ELEMENT"] = 2] = "ELEMENT";
    NodeTypes[NodeTypes["INTERPOLATION"] = 3] = "INTERPOLATION";
    NodeTypes[NodeTypes["SIMPLE_EXPRESSION"] = 4] = "SIMPLE_EXPRESSION";
    NodeTypes[NodeTypes["COMPOUND_EXPRESSION"] = 5] = "COMPOUND_EXPRESSION";
    //code_gen
    NodeTypes[NodeTypes["VNODE_CALL"] = 6] = "VNODE_CALL";
})(NodeTypes || (NodeTypes = {}));
function createVNodeCall(tag, props, children) {
    return {
        type: NodeTypes.VNODE_CALL,
        tag,
        props,
        children,
    };
}
function createCompoundExpressionNode(node) {
    return {
        type: NodeTypes.COMPOUND_EXPRESSION,
        children: [node],
    };
}
const isRootNode = (node) => node.type === NodeTypes.ROOT;
const isElementNode = (node) => node.type === NodeTypes.ELEMENT;
const isTextNode = (node) => node.type === NodeTypes.TEXT;
const isInterpolationNode = (node) => node.type === NodeTypes.INTERPOLATION;
const isText = (node) => isTextNode(node) || isInterpolationNode(node);

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const OPEN_BLOCK = Symbol("openBlock");
const CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [OPEN_BLOCK]: "openBlock",
    [CREATE_ELEMENT_BLOCK]: "createElementBlock",
};

//* 在transform之后，codegenNode 已经产生
function codegen(ast) {
    const context = createCodegenContext();
    genFunctionPreamble(context, ast);
    genFunctionBody(context, ast);
    return {
        code: context.code,
    };
}
function genFunctionBody(context, ast) {
    const { push, newLine } = context;
    let functionName = "render";
    let args = ["_ctx", " _cache", "$props", "$setup", "$data", "$options"];
    const signature = args.join(", ");
    push(`return function ${functionName}(${signature}) {\n`);
    push("\treturn (");
    //! 注意，这里传入的是 codegenNode
    genNode(context, ast.codegenNode);
    push(")");
    newLine();
    push("}");
}
function genFunctionPreamble(context, ast) {
    const { push, newLine } = context;
    const VueBinging = "vue";
    // const helpers = ["toDisplayString"]; now recorded in ast object
    const aliasHelpers = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers.length > 0)
        push(`const { ${ast.helpers
            .map(aliasHelpers)
            .join(", ")} } = ${VueBinging};`);
    newLine(2);
}
function genNode(context, node) {
    switch (node.type) {
        case NodeTypes.ELEMENT:
            //? 所有的 element 经过 transform的处理，都变成了 VNodeCall节点，进到这里说明transform出错了
            if (!node.codegenNode)
                throw new Error("[Codegen error]: transform failed");
            genNode(context, node.codegenNode);
            break;
        case NodeTypes.VNODE_CALL:
            //? element 节点走这里
            genVNodeCall(context, node);
            break;
        case NodeTypes.TEXT:
            genText(context, node);
            break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(context, node);
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(context, node);
            break;
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpressionNode(context, node);
            break;
    }
}
function genVNodeCall(context, node) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    // push(helper(OPEN_BLOCK));
    // push(", ");
    push(helper(CREATE_ELEMENT_BLOCK));
    //! 这里有一个比较麻烦的处理点：如果没有props，也没有children，那么函数只保留第一个参数即可，而如果有children，那么props的
    //! 位置必须要用 null来占住，这是函数传参所决定的，所以要干两件事：
    //* 1. 按照children,props,tag的顺序（从后往前）遍历，遇到null就置空，否则 break -> genNullableArgs
    //* 2. 把处理完毕的这三个参数继续处理即可 -> genNodeList
    //? 当然，目前情况下我们默认tag是不会为空的
    // push(`("${tag}", null, `);
    push("(");
    const nullableArgs = [`"${tag}"`, props, children];
    genNodeList(genNullableArgs(nullableArgs), context);
    push(")");
}
function genNullableArgs(args) {
    let i = args.length;
    while (i--) {
        if (args[i] != null)
            break;
    }
    return args.slice(0, i + 1).map(arg => arg || `null`);
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            if (isArray(node)) {
                push("[");
                for (let i = 0; i < node.length; i++) {
                    const child = node[i];
                    genNode(context, child);
                    if (i < node.length - 1)
                        push(", ");
                }
                push("]");
            }
            else {
                genNode(context, node);
            }
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genCompoundExpressionNode(context, node) {
    const { push } = context;
    for (const child of node.children) {
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(context, child);
        }
    }
}
function genText(context, node) {
    const { push } = context;
    push(`"${node.content}"`);
}
function genInterpolation(context, node) {
    const { push, helper } = context;
    push(helper(TO_DISPLAY_STRING));
    push("(");
    genNode(context, node.content);
    push(")");
}
function genExpression(context, node) {
    const { push } = context;
    push(node.content);
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
        newLine(n = 1) {
            context.push("\n".repeat(n));
        },
        tab(n = 1) {
            context.push("\t".repeat(n));
        },
    };
    return context;
}

function baseParse(content) {
    const context = createParserContext(content);
    //* 解析的过程是从头到尾逐步推进的，所以需要解析一部分然后就剪掉，这样解析的过程才是可持续的。
    //* 而判断用什么方法进行解析，则是根据当前待解析字符串的头部元素进行判断，如如果发现字符串头部为 {{，
    //* 说明接下来是插值，那么就调用相应的函数进行解析。同时，用于步进剪切的函数可以抽离出来，这样各种类型的解析都可以复用
    return createRoot(parseChildren(context, []));
}
//? 递归下降算法 @fn parseChildren
function parseChildren(context, ancesters) {
    const nodes = [];
    while (!isEnd(context, ancesters)) {
        let node = null;
        const { mode, source } = context;
        //*只有在 DATA 和 RCDATA 的状态下才解析插值
        //*只有在 DATA 状态下才解析html标签
        if (mode === 0 /* TextModes.DATA */ || mode === 1 /* TextModes.RCDATA */) {
            if (mode === 0 /* TextModes.DATA */ && source[0] === "<") {
                //* tag: <div>, endTag: </div>, comment: <!-->, CDATA: <![CDATA[]]>
                if (source[1] === "!") {
                    if (source.startsWith("<!--")) ;
                    else if (source.startsWith("<![CDATA[")) ;
                }
                else if (source[1] === "/") {
                    //! should not reach this branch
                    //! but here we do nothing, and throw error in parseElement
                    continue;
                }
                else if (/[a-z0-9]/i.test(source[1])) {
                    //tag
                    node = parseElement(context, ancesters);
                }
            }
            else if (source.startsWith("{{")) {
                //插值
                node = parseInterpolation(context);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancesters) {
    const s = context.source;
    if (s.startsWith("</")) {
        //? 为什么要遍历而不是直接检查栈顶？ 因为标签不一定是完全匹配的，因此要使用更健壮的检查策略，否则在出问题时会陷入死循环
        //* 从后往前搜索以提高命中率
        for (let i = ancesters.length - 1; i >= 0; i--) {
            const el = ancesters[i];
            if (s.startsWith(`</${el.tag}>`))
                return true;
        }
    }
    return !s;
}
//@fn parseText
function parseText(context) {
    let s = context.source;
    let endIndex = s.length;
    let endTokens = ["{{", "<"];
    let index = -1;
    for (const token of endTokens) {
        index = s.indexOf(token);
        if (index !== -1) {
            endIndex = Math.min(endIndex, index);
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: NodeTypes.TEXT,
        content,
    };
}
//@fn parseTextData
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
//@fn parseElement
function parseElement(context, ancesters) {
    //? 思路，先提取出tag内容，然后进行 括号匹配？找到相应的闭合标签
    const element = parseTag(context, 0 /* TagType.START */);
    ancesters.push(element);
    element.children = parseChildren(context, ancesters);
    ancesters.pop();
    if (context.source.startsWith(`</${element.tag}>`)) {
        parseTag(context, 1 /* TagType.END */);
    }
    else {
        throw new Error(`[Parse Error]: tag <${element.tag}> lack end tag.`);
    }
    return element;
}
//@fn parseTag
function parseTag(context, type) {
    const match = /^<\/?([a-z0-9]+)/i.exec(context.source);
    let tag;
    if (match) {
        tag = match[1];
        advanceBy(context, match[0].length + 1);
    }
    if (type === 1 /* TagType.END */)
        return;
    return {
        type: NodeTypes.ELEMENT,
        tag,
        children: [],
        codegenNode: undefined,
    };
}
//@fn parseInterpolation
function parseInterpolation(context) {
    //todo 解析插值
    //? {{exp}} -> exp
    const openDelimeter = "{{";
    const closeDelimeter = "}}";
    const closeIdx = context.source.indexOf(closeDelimeter, openDelimeter.length);
    advanceBy(context, openDelimeter.length); //舍弃前两位的 {{
    const contentLength = closeIdx - openDelimeter.length;
    const rawContent = parseTextData(context, contentLength);
    const content = rawContent.trim();
    advanceBy(context, closeDelimeter.length);
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content,
        },
    };
}
function advanceBy(context, start) {
    context.source = context.source.slice(start);
}
function createRoot(children) {
    return {
        type: NodeTypes.ROOT,
        helpers: [],
        children,
        //? 在transformElement中赋值，用于parseElement的后续操作，在其他地方可以直接忽略
        //? 且这里node的类型是 VnodeCall
        codegenNode: undefined,
    };
}
function createParserContext(content) {
    return {
        source: content,
        mode: 0 /* TextModes.DATA */,
    };
}

function transform(root, options) {
    const context = createTransformContext(root, options);
    //*DFS
    traverseNode(root, context);
    //* transformElement -> 获取到了codegenNode
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0]; //目前只考虑单个根的ast树
    if (isElementNode(child)) {
        //?这样就把 transform 中生成的 codegenNode 赋值到root内部了，然后就可以通过context进行全局的访问了
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: (options === null || options === void 0 ? void 0 : options.nodeTransforms) || [],
        helpers: new Map(),
        helper(names) {
            for (const name of names) {
                context.helpers.set(name, true);
            }
        },
    };
    return context;
}
function traverseNode(node, context) {
    const transforms = context.nodeTransforms;
    const exitFns = [];
    for (const child of node.children) {
        if (isRootNode(child)) {
            traverseNode(child, context);
        }
        else if (isElementNode(child)) {
            traverseNode(child, context);
        }
        else if (isTextNode(child)) ;
        else if (isInterpolationNode(child)) {
            context.helper([TO_DISPLAY_STRING]);
        }
        //* transform的插件的顺序必须是类似后序遍历的顺序，即先转换子节点，再转换父节点
        //* 具体实现为：设置一个堆栈，记录回调函数，然后从栈顶执行，context保存在闭包内
        //! 同时，由于引入的这样的机制，对于同一个节点的转换，会先执行后面的处理函数，如 nodetransforms = [fn1,fn2];
        //! 会先执行 fn2,再执行 fn1
        //! 更加复杂的情况，对于某个transform插件，前一部分是同步执行的逻辑 A，然后返回一个exitFn B,另一个插件类似有同步逻辑 C,返回函数 D，
        //! 那么执行的顺序为 A->C->D->B
        for (const fn of transforms) {
            const onExit = fn(child, context);
            if (onExit) {
                exitFns.push(onExit);
            }
        }
    }
    for (let i = exitFns.length - 1; i >= 0; i--) {
        const exitFn = exitFns[i];
        exitFn();
    }
}

//? transform 作为中间层，充当parse和codegen之间的桥梁
const transformElement = (node, context) => {
    //! 这一步的 transform一定要在 codegen之前，这样才能产生 codegenNode并且在codegen中使用
    return () => {
        if (isElementNode(node)) {
            context.helper([OPEN_BLOCK, CREATE_ELEMENT_BLOCK]);
            //todo tag
            const vnodeTag = node.tag;
            //todo props
            const vnodeProps = null;
            //*children
            let vnodeChildren = null;
            if (node.children.length > 0) {
                if (node.children.length === 1) {
                    vnodeChildren = node.children[0];
                }
                else {
                    vnodeChildren = node.children;
                }
            }
            ({
                type: NodeTypes.ELEMENT,
                tag: vnodeTag,
                props: vnodeProps,
                children: vnodeChildren,
            });
            node.codegenNode = createVNodeCall(vnodeTag, vnodeProps, vnodeChildren);
        }
    };
};

const transformExpression = node => {
    return () => {
        if (isInterpolationNode(node)) {
            node.content = processExpression(node.content);
        }
    };
};
function processExpression(node) {
    node.content = "_ctx." + node.content;
    return node;
}

//? 把相邻的 text节点和 interpolation节点合并成新的复合节点，这样有利于更好地渲染
const transformText = node => {
    return () => {
        //* 放入回调函数，从下层往上执行
        let compoundNode;
        if (isElementNode(node)) {
            const { children } = node;
            for (let i = 0; i < children.length - 1; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const nextChild = children[j];
                        if (isText(nextChild)) {
                            if (!compoundNode) {
                                compoundNode = children[i] =
                                    createCompoundExpressionNode(child);
                            }
                            compoundNode.children.push(" + ");
                            compoundNode.children.push(nextChild);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            compoundNode = undefined;
                            break;
                        }
                    }
                }
            }
        }
    };
};

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformElement, transformText, transformExpression],
    });
    return codegen(ast);
}

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
    $props: i => i.props,
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
        update: null,
        isMounted: false,
        subTree: null,
        next: null,
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
    else if (compiler && !instance.render) {
        //* 执行编译函数
        if (component.template) {
            component.render = compiler(component.template);
            instance.render = component.render;
        }
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeComplier(_complier) {
    compiler = _complier;
}

function shouldUpdateComponent(n1, n2) {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key])
            return true;
    }
    return false;
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
        component: null,
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
const createElementBlock = h;
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

const queue = [];
let isFlushPending = false;
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    //只收集一次
    if (isFlushPending)
        return;
    isFlushPending = true;
    Promise.resolve().then(() => {
        isFlushPending = false;
        let job;
        while ((job = queue.shift())) {
            job && job();
        }
    });
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
                patch(n1, n2, n1.el, parentAnchor); //递归地对比
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
            let maxNewIndexSoFar = 0;
            let moved = false;
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
                    if (nextChildIdx > maxNewIndexSoFar) {
                        maxNewIndexSoFar = nextChildIdx;
                    }
                    else {
                        moved = true;
                    }
                }
                else {
                    //* 没找到 -> 删除prevChild
                    hostRemove(prevChild.el);
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let k = increasingNewIndexSequence.length - 1;
            let anchor = e2 + 1 >= c2.length ? null : c2[e2 + 1].el;
            for (let j = toBePatched - 1; j >= 0; j--) {
                if (newIndexToOldIndexMap[j] === 0) {
                    //* 这个节点在老的序列中不存在
                    const currentNode = c2[j + initalPos];
                    patch(null, currentNode, container, anchor);
                    anchor = currentNode.el;
                }
                else if (moved) {
                    const currentEl = c2[j + initalPos].el;
                    if (k < 0 || j !== increasingNewIndexSequence[k]) {
                        //* 节点位置发生改变，需要将节点插入到锚点处
                        hostInsert(currentEl, container, anchor);
                        //* 这个节点位置固定，它作为新的锚点
                    }
                    else {
                        //* 节点位置没有改变，正常遍历
                        k--;
                        //* 此时这个节点位置固定了，它变成了新的锚点
                    }
                    anchor = currentEl;
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
            patchComponent(n1, n2);
        }
    }
    // 组件挂载 @fn mountComponent
    function mountComponent(vnode, container) {
        const instance = (vnode.component = createComponentInstance(vnode));
        //* 这一步初始化了Props，slots，setup函数，
        //* component proxy
        setupComponent(instance);
        //* 真正的渲染 + effect
        setupRenderEffect(instance, container);
    }
    //+ 在这里使用 effect @fn setupRendereffect
    function setupRenderEffect(instance, container) {
        instance.update = effect(() => {
            //* 调用组件的render函数以获取vnode，然后挂载
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container);
                //! 这一步很关键，patch中设置的 el是为subTree节点设置的，这里还要再次赋值
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("[setupRenderEffect]: update");
                const { next: nextVNode, vnode: prevVNode } = instance;
                if (nextVNode) {
                    nextVNode.el = prevVNode.el;
                    updateComponentPreRender(instance, nextVNode);
                }
                //* 拿到新的 subtree
                //* 这里是由 effect触发的，而 proxy的绑定在setupComponent中，所以需要再次绑定
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                console.log("prev: ", prevSubTree);
                console.log("current", subTree);
                //! 这里第三个参数一定不能使用container，这里的 container是闭包里面的 container，是顶层容器, 真正用于更新的是 el
                patch(prevSubTree, subTree, prevSubTree.el);
            }
        }, {
            scheduler() {
                console.log("scheduler");
                queueJobs(instance.update);
            },
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.props = nextVNode.props;
        instance.next = null;
    }
    //@fn patchComponent
    function patchComponent(n1, n2, container) {
        console.log("[Patch component]: patch");
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function unmount(vnode) {
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

var vue = /*#__PURE__*/Object.freeze({
    __proto__: null,
    renderer: renderer,
    createApp: createApp,
    toDisplayString: toDisplayString,
    nextTick: nextTick,
    createRenderer: createRenderer,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeComplier: registerRuntimeComplier,
    createTextVNode: createTextVNode,
    renderSlots: renderSlots,
    h: h,
    createElementBlock: createElementBlock
});

function compilerToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("vue", code)(vue);
    return render;
}
registerRuntimeComplier(compilerToFunction);

exports.compilerToFunction = compilerToFunction;
exports.computed = computed;
exports.createApp = createApp;
exports.createElementBlock = createElementBlock;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.isReactive = isReactive;
exports.isRef = isRef;
exports.nextTick = nextTick;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.ref = ref;
exports.registerRuntimeComplier = registerRuntimeComplier;
exports.renderSlots = renderSlots;
exports.renderer = renderer;
exports.toDisplayString = toDisplayString;
//# sourceMappingURL=aiyso-vue.cjs.js.map

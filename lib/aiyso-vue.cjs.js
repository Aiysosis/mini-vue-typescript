'use strict';

function createVNode(type, props, children) {
    //todo createVNode
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
}
const h = createVNode;

function createComponentInstance(vnode) {
    return {
        vnode,
    };
}
function setupComponent(instance) {
    //todo initProps();
    //todo initSlots();
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const { setup } = instance.vnode.type;
    if (setup) {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    //* finish setup
    //* 把 render函数放入instance中
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.vnode.type;
    const render = component.render;
    if (render) {
        instance.render = render;
    }
}

function createRenderer(options) {
    const { patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, createElement: hostCreateElement, createText: hostCreateText, setText: hostSetText, setElementText: hostSetElementText, } = options;
    function processElement(n1, n2, container) {
        if (!n1) {
            mountElement(n2, container);
        }
    }
    const patch = (n1, n2, container) => {
        //* 两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
        //* 如果新旧的 tagName 不一样，那么直接卸载旧的，然后挂新的上去
        if (n1 && n1.type !== n2.type) {
            n1 = null;
        }
        if (typeof n2.type === "object") {
            processComponent(n1, n2, container);
        }
        else {
            processElement(n1, n2, container);
        }
    };
    function mountElement(vnode, container) {
        const el = hostCreateElement(vnode.type);
        //* 引用实际的 dom 元素，用于后续的卸载操作
        vnode.el = el;
        //+ 本次流程不会涉及
        // if (vnode.props) {
        // 	for (const key in vnode.props) {
        // 		patchProps(el, key, null, vnode.props[key]);
        // 	}
        // }
        //* process children
        if (typeof vnode.children === "string") {
            //* child is plain text
            // el.innerHTML = vnode.children;
            hostSetElementText(el, vnode.children);
        }
        else {
            //* child is vnode
            //* 递归调用
            vnode.children.forEach(node => {
                mountElement(node, el);
            });
        }
        //* insert
        hostInsert(el, container);
    }
    function processComponent(n1, n2, container) {
        if (!n1) {
            mountComponent(n2, container);
        }
    }
    // 组件挂载
    function mountComponent(vnode, container) {
        const instance = createComponentInstance(vnode);
        //+ 这一步初始化了Props，slots，setup函数，
        //+ instance 多了两个属性：setupState(setup函数的返回值),render(组件的 render函数)
        setupComponent(instance);
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        const subTree = instance.render();
        patch(null, subTree, container);
    }
    function unmount(vnode) {
        //todo 调用声明周期函数 or 钩子函数
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
        return {};
    },
    setText(node, text) { },
    setElementText(node, text) {
        node.innerHTML = text;
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

exports.createApp = createApp;
exports.h = h;
//# sourceMappingURL=aiyso-vue.cjs.js.map

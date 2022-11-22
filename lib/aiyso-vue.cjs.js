'use strict';

function createVNode(type, props, children) {
    //todo createVNode
    const vnode = {
        type,
        props,
        children,
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
    if (setupResult === "object") {
        instance.setupState = setupResult;
    }
    //* finish setup
    //* 把 render函数放入instance中
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const render = instance.vnode.type.render;
    if (render) {
        instance.render = render;
    }
}

function createRenderer() {
    function patch(n1, n2, container) {
        //todo 不止组件
        //? 只实现主流程
        //? n1=null n2=vnode n2.type=component container=rootContainer
        console.log(container);
        if (typeof n2.type === "object") {
            // 经过判断新旧节点都是组件
            processComponent(n1, n2, container);
        }
    }
    function processComponent(n1, n2, container) {
        if (!n1) {
            mountComponent(n2, container);
        }
    }
    // 组件挂载
    function mountComponent(vnode, container) {
        const instance = createComponentInstance(vnode);
        // 这一步初始化了Props，slots，setup函数，
        // instance 多了两个属性：setupState(setup函数的返回值),render(组件的 render函数)
        setupComponent(instance);
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        const subTree = instance.render();
        patch(null, subTree, container);
    }
    function render(vnode, container) {
        if (vnode) {
            //* 有 vnode，进行patch操作
            patch(container._vnode, vnode, container);
        }
    }
    return {
        render,
    };
}
const renderer = createRenderer();

function createApp(app) {
    //todo createApp
    return {
        mount: rootContainer => {
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

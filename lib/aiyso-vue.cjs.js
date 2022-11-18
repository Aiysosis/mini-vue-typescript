'use strict';

function createRenderer() {
    function mountElement(vnode, container) {
        const el = document.createElement(vnode.type);
        if (typeof vnode.children === "string") {
            //是叶子节点，其内部是普通文本
            el.innerHTML = vnode.children;
        }
        else {
            //还有嵌套的节点，递归执行
            vnode.children.forEach(node => {
                //挂载位置为新创建的节点
                mountElement(node, el);
            });
        }
        //挂载
        container.appendChild(el);
    }
    /**
     *
     * @param n1 old VNode
     * @param n2 new VNode
     * @param container 挂载的元素
     */
    function patch(n1 = undefined, n2, container) {
        //两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
        if (!n1) {
            //oldNode 不存在，说明是第一次挂载，直接挂载元素
            mountElement(n2, container);
        }
    }
    function render(vnode, container) {
        //三种情况：渲染元素，更新元素
        if (vnode) {
            //渲染 or 更新，走patch
            patch(container._vnode, vnode, container);
        }
        else {
            //如果没有vnode，说明此时是一个清空节点的操作
            container.innerHTML = "";
        }
        //无论哪种情况，都要更新 container 的 _vnode 属性
        container._vnode = vnode;
    }
    return {
        render,
    };
}

exports.createRenderer = createRenderer;
//# sourceMappingURL=aiyso-vue.cjs.js.map

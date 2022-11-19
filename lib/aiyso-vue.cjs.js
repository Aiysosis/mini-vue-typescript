'use strict';

function shouldSetAsProps(el, key, value) {
    //特殊处理
    if (key === "form" && el.tagName === "input")
        return false;
    //兜底
    return key in el;
}
function createRenderer() {
    function mountElement(vnode, container) {
        const el = document.createElement(vnode.type);
        /*
         * props 可能有多种情况
         * 1. 普通的键值对 id="app"
         * 2. 只有键，不关心值 <buttn disabled/>
         * 3. 只读 <input form="form1"/>
         * //TODO 4. vue的绑定属性
         */
        if (vnode.props) {
            for (const key in vnode.props) {
                const type = typeof el[key];
                const value = vnode.props[key];
                if (shouldSetAsProps(el, key)) {
                    //要设置的属性是 DOM Properties
                    //? 例如 buttn 按钮的 disable
                    if (type === "boolean" && value === "") {
                        el[key] = true;
                    }
                    else {
                        el[key] = value;
                    }
                }
                else {
                    //设置的属性没有 DOM Properties, 使用 setAttribute
                    el.setAttribute(key, vnode[key]);
                }
            }
        }
        //* process children
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
        //* insert
        container.appendChild(el);
    }
    const patch = (n1, n2, container) => {
        //两种情况：挂载元素（其实就是第一次patch），更新元素（patch）
        if (!n1) {
            //oldNode 不存在，说明是第一次挂载，直接挂载元素
            mountElement(n2, container);
        }
    };
    const render = (vnode, container) => {
        //三种情况：渲染元素，更新元素
        if (vnode) {
            //渲染 or 更新，走patch
            patch(container._vnode || null, vnode, container);
        }
        else {
            //如果没有vnode，说明此时是一个清空节点的操作
            container.innerHTML = "";
        }
        //无论哪种情况，都要更新 container 的 _vnode 属性
        container._vnode = vnode;
    };
    return {
        render,
    };
}

exports.createRenderer = createRenderer;
//# sourceMappingURL=aiyso-vue.cjs.js.map

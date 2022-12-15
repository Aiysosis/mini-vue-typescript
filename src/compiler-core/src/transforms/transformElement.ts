//? transform 作为中间层，充当parse和codegen之间的桥梁

import { isElementNode, NodeTypes, VNodeCall } from "../ast";
import { CREATE_ELEMENT_BLOCK, OPEN_BLOCK } from "../runtimeHelpers";
import { TransformPlugin } from "../transform";

export const transformElement: TransformPlugin = (node, context) => {
	//! 这一步的 transform一定要在 codegen之前，这样才能产生 codegenNode并且在codegen中使用
	return () => {
		if (isElementNode(node)) {
			context.helper([OPEN_BLOCK, CREATE_ELEMENT_BLOCK]);

			//todo tag
			const vnodeTag = node.tag;

			//todo props
			const vnodeProps = {};

			//*children
			let vnodeChildren = null;

			if (node.children.length > 0) {
				if (node.children.length === 1) {
					vnodeChildren = node.children[0];
				} else {
					vnodeChildren = node.children;
				}
			}

			const vnodeElement: VNodeCall = {
				type: NodeTypes.ELEMENT,
				tag: vnodeTag,
				props: vnodeProps,
				children: vnodeChildren,
			};

			node.codegenNode = vnodeElement;
		}
	};
};

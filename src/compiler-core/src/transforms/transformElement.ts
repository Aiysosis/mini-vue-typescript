//? transform 作为中间层，充当parse和codegen之间的桥梁

import { TransformPlugin } from "../transform";

export const transformElement: TransformPlugin = node => {};

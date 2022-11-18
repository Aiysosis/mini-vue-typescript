const typescript = require("@rollup/plugin-typescript");

module.exports = {
	input: ["./src/index.ts"],
	output: [
		// 1 -> cjs
		// 2 -> esm
		{
			format: "cjs",
			file: "./lib/aiyso-vue.cjs.js",
			sourcemap: true,
		},
		{
			format: "esm",
			file: "./lib/aiyso-vue.esm.js",
			sourcemap: true,
		},
	],
	plugins: [typescript()],
};

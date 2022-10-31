module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	extends: ["prettier/@typescript-eslint", "plugin:prettier/recommended"],
	plugins: ["@typescript-eslint"],
	env: {
		browser: true,
		node: true,
	},
	rules: {
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-explicit-any": "off",
	},
};

# ESLint JSON Language Plugin

## Overview

This package contains a plugin that allows you to natively lint JSON, JSONC, and JSON5 files using ESLint.

**Important:** This plugin requires ESLint v9.6.0 or higher and you must be using the [new configuration system](https://eslint.org/docs/latest/use/configure/configuration-files).

## Installation

For Node.js and compatible runtimes:

```shell
npm install @eslint/json -D
# or
yarn add @eslint/json -D
# or
pnpm install @eslint/json -D
# or
bun add @eslint/json -D
```

For Deno:

```shell
deno add @eslint/json
```

## Usage

This package exports these languages:

- `"json/json"` is for regular JSON files
- `"json/jsonc"` is for JSON files that support comments ([JSONC](https://github.com/microsoft/node-jsonc-parser)) such as those used for [Visual Studio Code](https://code.visualstudio.com/) configuration files
- `"json/json5"` is for [JSON5](https://json5.org) files

Depending on which types of JSON files you'd like to lint, you can set up your `eslint.config.js` file to include just the files you'd like. Here's an example that lints JSON, JSONC, and JSON5 files:

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import json from "@eslint/json";

export default defineConfig([
	{
		plugins: {
			json,
		},
	},

	// lint JSON files
	{
		files: ["**/*.json"],
		language: "json/json",
		rules: {
			"json/no-duplicate-keys": "error",
		},
	},

	// lint JSONC files
	{
		files: ["**/*.jsonc", ".vscode/*.json"],
		language: "json/jsonc",
		rules: {
			"json/no-duplicate-keys": "error",
		},
	},

	// lint JSON5 files
	{
		files: ["**/*.json5"],
		language: "json/json5",
		rules: {
			"json/no-duplicate-keys": "error",
		},
	},
]);
```

In CommonJS format:

```js
// eslint.config.js
const { defineConfig } = require("eslint/config");
const json = require("@eslint/json").default;

module.exports = defineConfig([
	{
		plugins: {
			json,
		},
	},

	// lint JSON files
	{
		files: ["**/*.json"],
		language: "json/json",
		rules: {
			"json/no-duplicate-keys": "error",
		},
	},

	// lint JSONC files
	{
		files: ["**/*.jsonc", ".vscode/*.json"],
		language: "json/jsonc",
		rules: {
			"json/no-duplicate-keys": "error",
		},
	},

	// lint JSON5 files
	{
		files: ["**/*.json5"],
		language: "json/json5",
		rules: {
			"json/no-duplicate-keys": "error",
		},
	},
]);
```

## Recommended Configuration

To use the recommended configuration for this plugin, specify your matching `files` and then use the `extends: ["json/recommended"]` property, like this:

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import json from "@eslint/json";

export default defineConfig([
	// lint JSON files
	{
		files: ["**/*.json"],
		ignores: ["package-lock.json"],
		plugins: { json },
		language: "json/json",
		extends: ["json/recommended"],
	},

	// lint JSONC files
	{
		files: ["**/*.jsonc"],
		plugins: { json },
		language: "json/jsonc",
		extends: ["json/recommended"],
	},

	// lint JSON5 files
	{
		files: ["**/*.json5"],
		plugins: { json },
		language: "json/json5",
		extends: ["json/recommended"],
	},
]);
```

**Note:** You generally want to ignore `package-lock.json` because it is auto-generated and you typically will not want to manually make changes to it.

## Rules

<!-- NOTE: The following table is autogenerated. Do not manually edit. -->

<!-- Rule Table Start -->

| **Rule Name**                                                  | **Description**                                           | **Recommended** |
| :------------------------------------------------------------- | :-------------------------------------------------------- | :-------------: |
| [`no-duplicate-keys`](./docs/rules/no-duplicate-keys.md)       | Disallow duplicate keys in JSON objects                   |       yes       |
| [`no-empty-keys`](./docs/rules/no-empty-keys.md)               | Disallow empty keys in JSON objects                       |       yes       |
| [`no-unnormalized-keys`](./docs/rules/no-unnormalized-keys.md) | Disallow JSON keys that are not normalized                |       yes       |
| [`no-unsafe-values`](./docs/rules/no-unsafe-values.md)         | Disallow JSON values that are unsafe for interchange      |       yes       |
| [`sort-keys`](./docs/rules/sort-keys.md)                       | Require JSON object keys to be sorted                     |       no        |
| [`top-level-interop`](./docs/rules/top-level-interop.md)       | Require the JSON top-level value to be an array or object |       no        |

<!-- Rule Table End -->

## Configuration Comments

In JSONC and JSON5 files, you can also use [rule configurations comments](https://eslint.org/docs/latest/use/configure/rules#using-configuration-comments) and [disable directives](https://eslint.org/docs/latest/use/configure/rules#disabling-rules).

```jsonc
/* eslint json/no-empty-keys: "error" */

{
	"foo": {
		"": 1, // eslint-disable-line json/no-empty-keys -- We want an empty key here
	},
	"bar": {
		// eslint-disable-next-line json/no-empty-keys -- We want an empty key here too
		"": 2,
	},
	/* eslint-disable json/no-empty-keys -- Empty keys are allowed in the following code as well */
	"baz": [
		{
			"": 3,
		},
		{
			"": 4,
		},
	],
	/* eslint-enable json/no-empty-keys -- re-enable now */
}
```

Both line and block comments can be used for all kinds of configuration comments.

## Allowing trailing commas in JSONC

The Microsoft implementation of JSONC optionally allows for trailing commas in objects and arrays (files like `tsconfig.json` have this option enabled by default in Visual Studio Code). To enable trailing commas in JSONC files, use the `allowTrailingCommas` language option, as in this example:

```js
// eslint.config.js
import { defineConfig } from "eslint/config";
import json from "@eslint/json";

export default defineConfig([
	// lint JSONC files
	{
		files: ["**/*.jsonc"],
		plugins: { json },
		language: "json/jsonc",
		extends: ["json/recommended"],
	},

	// lint JSONC files and allow trailing commas
	{
		files: ["**/tsconfig.json", ".vscode/*.json"],
		plugins: { json },
		language: "json/jsonc",
		languageOptions: {
			allowTrailingCommas: true,
		},
		extends: ["json/recommended"],
	},
]);
```

**Note:** The `allowTrailingCommas` option is only valid for the `json/jsonc` language.

## Frequently Asked Questions

### How does this relate to `eslint-plugin-json` and `eslint-plugin-jsonc`?

This plugin implements JSON parsing for ESLint using the language plugins API, which is the official way of supporting non-JavaScript languages in ESLint. This differs from the other plugins:

- [`eslint-plugin-json`](https://github.com/azeemba/eslint-plugin-json) uses a processor to parse the JSON, meaning it doesn't create an AST and you can't write custom rules for it.
- [`eslint-plugin-jsonc`](https://github.com/ota-meshi/eslint-plugin-jsonc) uses a parser that still goes through the JavaScript linting functionality and requires several rules to disallow valid JavaScript syntax that is invalid in JSON.

As such, this plugin is more robust and faster than the others. You can write your own custom rules when using the languages in this plugin, too.

### What about missing rules that are available in `eslint-plugin-json` and `eslint-plugin-jsonc`?

Most of the rules in `eslint-plugin-json` are actually syntax errors that are caught automatically by the parser used in this plugin.

Similarly, many of the rules in `eslint-plugin-jsonc` specifically disallow valid JavaScript syntax that is invalid in the context of JSON. These are also automatically caught by the parser in this plugin.

Any other rules that catch potential problems in JSON are welcome to be implemented. You can [open an issue](https://github.com/eslint/json/issues/new/choose) to propose a new rule.

## Editor and IDE Setup

### Visual Studio Code

First, ensure you have the [ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) installed.

Then, edit `eslint.validate` in your `settings.json` file to include `json`, `jsonc`, and `json5`:

```json
{
	"eslint.validate": ["json", "jsonc", "json5"]
}
```

### JetBrains WebStorm

For any [JetBrains WebStorm](https://www.jetbrains.com/webstorm/), configure the [ESLint scope](https://www.jetbrains.com/help/webstorm/eslint.html#ws_eslint_configure_scope) to include `json`, `jsonc`, and `json5`, such as:

```text
**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts,html,vue,json,jsonc,json5}
```

## License

Apache 2.0

<!-- NOTE: This section is autogenerated. Do not manually edit.-->
<!--sponsorsstart-->

## Sponsors

The following companies, organizations, and individuals support ESLint's ongoing maintenance and development. [Become a Sponsor](https://eslint.org/donate)
to get your logo on our READMEs and [website](https://eslint.org/sponsors).

<h3>Platinum Sponsors</h3>
<p><a href="https://automattic.com"><img src="https://images.opencollective.com/automattic/d0ef3e1/logo.png" alt="Automattic" height="128"></a> <a href="https://www.airbnb.com/"><img src="https://images.opencollective.com/airbnb/d327d66/logo.png" alt="Airbnb" height="128"></a></p><h3>Gold Sponsors</h3>
<p><a href="https://qlty.sh/"><img src="https://images.opencollective.com/qltysh/33d157d/logo.png" alt="Qlty Software" height="96"></a> <a href="https://trunk.io/"><img src="https://images.opencollective.com/trunkio/fb92d60/avatar.png" alt="trunk.io" height="96"></a> <a href="https://shopify.engineering/"><img src="https://avatars.githubusercontent.com/u/8085" alt="Shopify" height="96"></a></p><h3>Silver Sponsors</h3>
<p><a href="https://vite.dev/"><img src="https://images.opencollective.com/vite/e6d15e1/logo.png" alt="Vite" height="64"></a> <a href="https://liftoff.io/"><img src="https://images.opencollective.com/liftoff/5c4fa84/logo.png" alt="Liftoff" height="64"></a> <a href="https://americanexpress.io"><img src="https://avatars.githubusercontent.com/u/3853301" alt="American Express" height="64"></a> <a href="https://stackblitz.com"><img src="https://avatars.githubusercontent.com/u/28635252" alt="StackBlitz" height="64"></a></p><h3>Bronze Sponsors</h3>
<p><a href="https://cybozu.co.jp/"><img src="https://images.opencollective.com/cybozu/933e46d/logo.png" alt="Cybozu" height="32"></a> <a href="https://sentry.io"><img src="https://github.com/getsentry.png" alt="Sentry" height="32"></a> <a href="https://www.crosswordsolver.org/anagram-solver/"><img src="https://images.opencollective.com/anagram-solver/2666271/logo.png" alt="Anagram Solver" height="32"></a> <a href="https://icons8.com/"><img src="https://images.opencollective.com/icons8/7fa1641/logo.png" alt="Icons8" height="32"></a> <a href="https://discord.com"><img src="https://images.opencollective.com/discordapp/f9645d9/logo.png" alt="Discord" height="32"></a> <a href="https://www.gitbook.com"><img src="https://avatars.githubusercontent.com/u/7111340" alt="GitBook" height="32"></a> <a href="https://nx.dev"><img src="https://avatars.githubusercontent.com/u/23692104" alt="Nx" height="32"></a> <a href="https://opensource.mercedes-benz.com/"><img src="https://avatars.githubusercontent.com/u/34240465" alt="Mercedes-Benz Group" height="32"></a> <a href="https://herocoders.com"><img src="https://avatars.githubusercontent.com/u/37549774" alt="HeroCoders" height="32"></a> <a href="https://www.lambdatest.com"><img src="https://avatars.githubusercontent.com/u/171592363" alt="LambdaTest" height="32"></a></p>
<h3>Technology Sponsors</h3>
Technology sponsors allow us to use their products and services for free as part of a contribution to the open source ecosystem and our work.
<p><a href="https://netlify.com"><img src="https://raw.githubusercontent.com/eslint/eslint.org/main/src/assets/images/techsponsors/netlify-icon.svg" alt="Netlify" height="32"></a> <a href="https://algolia.com"><img src="https://raw.githubusercontent.com/eslint/eslint.org/main/src/assets/images/techsponsors/algolia-icon.svg" alt="Algolia" height="32"></a> <a href="https://1password.com"><img src="https://raw.githubusercontent.com/eslint/eslint.org/main/src/assets/images/techsponsors/1password-icon.svg" alt="1Password" height="32"></a></p>
<!--sponsorsend-->

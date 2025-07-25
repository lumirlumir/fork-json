/**
 * @fileoverview The JSONSourceCode class.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { iterator } from "@humanwhocodes/momoa";
import {
	VisitNodeStep,
	TextSourceCodeBase,
	ConfigCommentParser,
	Directive,
} from "@eslint/plugin-kit";

//-----------------------------------------------------------------------------
// Types
//-----------------------------------------------------------------------------

/**
 * @import { DocumentNode, AnyNode, Token } from "@humanwhocodes/momoa";
 * @import { SourceLocation, FileProblem, DirectiveType, RulesConfig } from "@eslint/core";
 * @import { JSONSyntaxElement } from "../types.ts";
 * @import { JSONLanguageOptions } from "./json-language.js";
 */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

const commentParser = new ConfigCommentParser();

const INLINE_CONFIG =
	/^\s*(?:eslint(?:-enable|-disable(?:(?:-next)?-line)?)?)(?:\s|$)/u;

/**
 * A class to represent a step in the traversal process.
 */
class JSONTraversalStep extends VisitNodeStep {
	/**
	 * The target of the step.
	 * @type {AnyNode}
	 */
	target = undefined;

	/**
	 * Creates a new instance.
	 * @param {Object} options The options for the step.
	 * @param {AnyNode} options.target The target of the step.
	 * @param {1|2} options.phase The phase of the step.
	 * @param {Array<any>} options.args The arguments of the step.
	 */
	constructor({ target, phase, args }) {
		super({ target, phase, args });

		this.target = target;
	}
}

/**
 * Processes tokens to extract comments and their starting tokens.
 * @param {Array<Token>} tokens The tokens to process.
 * @returns {{ comments: Array<Token>, starts: Map<number, number>, ends: Map<number, number>}}
 * An object containing an array of comments, a map of starting token range to token index, and
 * a map of ending token range to token index.
 */
function processTokens(tokens) {
	/** @type {Array<Token>} */
	const comments = [];

	/** @type {Map<number, number>} */
	const starts = new Map();

	/** @type {Map<number, number>} */
	const ends = new Map();

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.type.endsWith("Comment")) {
			comments.push(token);
		}

		starts.set(token.range[0], i);
		ends.set(token.range[1], i);
	}

	return { comments, starts, ends };
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * JSON Source Code Object
 * @extends {TextSourceCodeBase<{LangOptions: JSONLanguageOptions, RootNode: DocumentNode, SyntaxElementWithLoc: JSONSyntaxElement, ConfigNode: Token}>}
 */
export class JSONSourceCode extends TextSourceCodeBase {
	/**
	 * Cached traversal steps.
	 * @type {Array<JSONTraversalStep>|undefined}
	 */
	#steps;

	/**
	 * Cache of parent nodes.
	 * @type {WeakMap<AnyNode, AnyNode>}
	 */
	#parents = new WeakMap();

	/**
	 * Collection of inline configuration comments.
	 * @type {Array<Token>}
	 */
	#inlineConfigComments;

	/**
	 * The AST of the source code.
	 * @type {DocumentNode}
	 */
	ast = undefined;

	/**
	 * The comment tokens in the source code.
	 * @type {Array<Token>|undefined}
	 */
	comments;

	/**
	 * A map of token start positions to their corresponding index.
	 * @type {Map<number, number>}
	 */
	#tokenStarts;

	/**
	 * A map of token end positions to their corresponding index.
	 * @type {Map<number, number>}
	 */
	#tokenEnds;

	/**
	 * Creates a new instance.
	 * @param {Object} options The options for the instance.
	 * @param {string} options.text The source code text.
	 * @param {DocumentNode} options.ast The root AST node.
	 */
	constructor({ text, ast }) {
		super({ text, ast });
		this.ast = ast;

		const { comments, starts, ends } = processTokens(this.ast.tokens ?? []);
		this.comments = comments;
		this.#tokenStarts = starts;
		this.#tokenEnds = ends;
	}

	/**
	 * Returns the value of the given comment.
	 * @param {Token} comment The comment to get the value of.
	 * @returns {string} The value of the comment.
	 * @throws {Error} When an unexpected comment type is passed.
	 */
	#getCommentValue(comment) {
		if (comment.type === "LineComment") {
			return this.getText(comment).slice(2); // strip leading `//`
		}

		if (comment.type === "BlockComment") {
			return this.getText(comment).slice(2, -2); // strip leading `/*` and trailing `*/`
		}

		throw new Error(`Unexpected comment type '${comment.type}'`);
	}

	/**
	 * Returns an array of all inline configuration nodes found in the
	 * source code.
	 * @returns {Array<Token>} An array of all inline configuration nodes.
	 */
	getInlineConfigNodes() {
		if (!this.#inlineConfigComments) {
			this.#inlineConfigComments = this.comments.filter(comment =>
				INLINE_CONFIG.test(this.#getCommentValue(comment)),
			);
		}

		return this.#inlineConfigComments ?? [];
	}

	/**
	 * Returns directives that enable or disable rules along with any problems
	 * encountered while parsing the directives.
	 * @returns {{problems:Array<FileProblem>,directives:Array<Directive>}} Information
	 *      that ESLint needs to further process the directives.
	 */
	getDisableDirectives() {
		/** @type {Array<FileProblem>} */
		const problems = [];
		/** @type {Array<Directive>} */
		const directives = [];

		this.getInlineConfigNodes().forEach(comment => {
			const { label, value, justification } =
				commentParser.parseDirective(this.#getCommentValue(comment));

			// `eslint-disable-line` directives are not allowed to span multiple lines as it would be confusing to which lines they apply
			if (
				label === "eslint-disable-line" &&
				comment.loc.start.line !== comment.loc.end.line
			) {
				const message = `${label} comment should not span multiple lines.`;

				problems.push({
					ruleId: null,
					message,
					loc: comment.loc,
				});
				return;
			}

			switch (label) {
				case "eslint-disable":
				case "eslint-enable":
				case "eslint-disable-next-line":
				case "eslint-disable-line": {
					const directiveType = label.slice("eslint-".length);

					directives.push(
						new Directive({
							type: /** @type {DirectiveType} */ (directiveType),
							node: comment,
							value,
							justification,
						}),
					);
				}

				// no default
			}
		});

		return { problems, directives };
	}

	/**
	 * Returns inline rule configurations along with any problems
	 * encountered while parsing the configurations.
	 * @returns {{problems:Array<FileProblem>,configs:Array<{config:{rules:RulesConfig},loc:SourceLocation}>}} Information
	 *      that ESLint needs to further process the rule configurations.
	 */
	applyInlineConfig() {
		/** @type {Array<FileProblem>} */
		const problems = [];
		/** @type {Array<{config:{rules:RulesConfig},loc:SourceLocation}>} */
		const configs = [];

		this.getInlineConfigNodes().forEach(comment => {
			const { label, value } = commentParser.parseDirective(
				this.#getCommentValue(comment),
			);

			if (label === "eslint") {
				const parseResult = commentParser.parseJSONLikeConfig(value);

				if (parseResult.ok) {
					configs.push({
						config: {
							rules: parseResult.config,
						},
						loc: comment.loc,
					});
				} else {
					problems.push({
						ruleId: null,
						message:
							/** @type {{ok: false, error: { message: string }}} */ (
								parseResult
							).error.message,
						loc: comment.loc,
					});
				}
			}
		});

		return {
			configs,
			problems,
		};
	}

	/**
	 * Returns the parent of the given node.
	 * @param {AnyNode} node The node to get the parent of.
	 * @returns {AnyNode|undefined} The parent of the node.
	 */
	getParent(node) {
		return this.#parents.get(node);
	}

	/**
	 * Traverse the source code and return the steps that were taken.
	 * @returns {Iterable<JSONTraversalStep>} The steps that were taken while traversing the source code.
	 */
	traverse() {
		// Because the AST doesn't mutate, we can cache the steps
		if (this.#steps) {
			return this.#steps.values();
		}

		/** @type {Array<JSONTraversalStep>} */
		const steps = (this.#steps = []);

		for (const { node, parent, phase } of iterator(this.ast)) {
			if (parent) {
				this.#parents.set(
					/** @type {AnyNode} */ (node),
					/** @type {AnyNode} */ (parent),
				);
			}

			steps.push(
				new JSONTraversalStep({
					target: /** @type {AnyNode} */ (node),
					phase: phase === "enter" ? 1 : 2,
					args: [node, parent],
				}),
			);
		}

		return steps;
	}

	/**
	 * Gets the token before the given node or token, optionally including comments.
	 * @param {AnyNode|Token} nodeOrToken The node or token to get the previous token for.
	 * @param {Object} [options] Options object.
	 * @param {boolean} [options.includeComments] If true, return comments when they are present.
	 * @returns {Token|null} The previous token or comment, or null if there is none.
	 */
	getTokenBefore(nodeOrToken, { includeComments = false } = {}) {
		const index = this.#tokenStarts.get(nodeOrToken.range[0]);

		if (index === undefined) {
			return null;
		}

		let previousIndex = index - 1;
		if (previousIndex < 0) {
			return null;
		}

		const tokens = this.ast.tokens;
		let tokenOrComment = tokens[previousIndex];

		if (includeComments) {
			return tokenOrComment;
		}

		// skip comments
		while (tokenOrComment?.type.endsWith("Comment")) {
			previousIndex--;

			if (previousIndex < 0) {
				return null;
			}

			tokenOrComment = tokens[previousIndex];
		}
		return tokenOrComment;
	}

	/**
	 * Gets the token after the given node or token, skipping any comments unless includeComments is true.
	 * @param {AnyNode|Token} nodeOrToken The node or token to get the next token for.
	 * @param {Object} [options] Options object.
	 * @param {boolean} [options.includeComments=false] If true, return comments when they are present.
	 * @returns {Token|null} The next token or comment, or null if there is none.
	 */
	getTokenAfter(nodeOrToken, { includeComments = false } = {}) {
		const index = this.#tokenEnds.get(nodeOrToken.range[1]);

		if (index === undefined) {
			return null;
		}

		let nextIndex = index + 1;
		const tokens = this.ast.tokens;
		if (nextIndex >= tokens.length) {
			return null;
		}

		let tokenOrComment = tokens[nextIndex];

		if (includeComments) {
			return tokenOrComment;
		}

		// skip comments
		while (tokenOrComment?.type.endsWith("Comment")) {
			nextIndex++;

			if (nextIndex >= tokens.length) {
				return null;
			}

			tokenOrComment = tokens[nextIndex];
		}

		return tokenOrComment;
	}
}

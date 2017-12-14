'use strict'

const VError = require('verror');
const async = require('async');
const fs = require('fs');
const _ = require('lodash');

const { googleSearch, wikiSearch } = require('../common');
const breakTheTie = require('./break_the_tie');
const nlpExtract = require('./nlp_extract');

const PAGES = 1;
const notReg = /\bnot\b|\bnever\b/i;

const count = (pages, targets) => targets.map((target) => {
	const regex = new RegExp(target, 'gi');
	const count = pages.reduce((sum, page) => sum += (page.match(regex) || []).length, 0);
	return count;
});

const processGoogleResult = (pages, targets) => count(pages, targets);

const processWikiResult = (page, targets) => count([ page ], targets);

const combine = (ggCounts, wkCounts) => {
	const combined = [];
	for(let i = 0; i < ggCounts.length; i++) {
		combined.push(ggCounts[i] + wkCounts[i]);
	};
	return combined;
};

async function magicProcess(question) {
	const targets = _.map(question.answers, 'text');

	// Test if Question is Negative
	const not = notReg.test(question.question);

	// Extract Keywords
	const keywords = await nlpExtract(question.question);
	const searchContent = keywords.join(' ');

	// Google Search and Wikipedia Search to Get Counts
	const counts = await Promise.all([googleSearch(searchContent, PAGES), wikiSearch(searchContent)]).then((results) => {
		const googleCounts = processGoogleResult(results[0], targets);
		const wikiCounts = processWikiResult(results[1], targets);

		return combine(googleCounts, wikiCounts);
	});

	// Break the Tie
	return await breakTheTie(counts, question, not, keywords);
}

module.exports = magicProcess;
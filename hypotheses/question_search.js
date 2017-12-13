'use strict'

const fs = require('fs');
const VError = require('verror');

const { googleSearch } = require('../common');

const PAGES = 2;

module.exports = (question, cb) => {
	const not = /\bnot\b/i.test(question.question);
	const sort = (a, b) => (not ? 1 : -1) * (a.count < b.count ? -1 : a.count > b.count ? 1 : 0);

	const count = (pages) => question.answers.map((answer, index) => {
		const regex = new RegExp(answer.text, 'gi');
		const count = pages.reduce((sum, page) => sum += (page.match(regex) || []).length, 0);

		return { answer, index, count };
	});

	return googleSearch(question.question, PAGES)
		.then((pages) => count(pages).sort(sort))
		.catch((err) => new VError(err, 'Failed to search google'));
};


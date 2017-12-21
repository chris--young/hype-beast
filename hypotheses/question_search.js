'use strict'

const fs = require('fs');
const VError = require('verror');

const { googleSearch } = require('../common');

const PAGES = 2;

const sort = (a, b) => a.score < b.score ? 1 : a.score > b.score ? -1 : 0;

module.exports = (question) => {
	const not = /\bnot\b/i.test(question.question);

	const guess = (pages) => question.answers.map((answer, index) => {
		let score = 0;

		const check = (regex) => pages.forEach((page, index) => score += (page.match(regex) || []).length / (index + 1));

		check(new RegExp(answer.text, 'gi'));
		check(new RegExp(encodeURIComponent(answer.text), 'gi'));
		check(new RegExp(answer.text.split(' ').reverse().join(' '), 'gi'));

		if (not)
			score *= -1;

		return { answer, index, score };
	});

	return googleSearch(question.question, PAGES)
		.then((pages) => guess(pages).sort(sort))
		.catch((err) => Promise.reject(new VError(err, 'Failed to search google')));
};


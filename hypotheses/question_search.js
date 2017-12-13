'use strict'

const fs = require('fs');
const VError = require('verror');

const { googleSearch } = require('../common');

module.exports = (question, cb) => {
	const not = /\bnot\b/i.test(question.question);
	const sort = (a, b) => (not ? 1 : -1) * (a.count < b.count ? -1 : a.count > b.count ? 1 : 0);

	const count = (body) => question.answers.map((answer, index) => {
		const regex = new RegExp(answer.text, 'gi');
		const count = (body.match(regex) || []).length;

		return { answer, index, count };
	});

	return googleSearch(question.question)
		.then((body) => count(body).sort(sort))
		.catch((err) => new VError('Failed to search google'));
};


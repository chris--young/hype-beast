'use strict'

const fs = require('fs');
const VError = require('verror');
const common = require('./common.js');

module.exports = function (question, cb) {
	const not = /\bnot\b/i.test(question.question);
	const check = (count, score) => not ? count <= score : count >= score;

	common.googleSearch(question.question, (err, body) => {
		if (err)
			return cb(new VError('Failed to search google'), null);;

		let score = 0;
		let guess = null;

		question.answers.forEach((answer, index) => {
			const regex = new RegExp(answer.text, 'gi');
			const count = (body.match(regex) || []).length;

			if (check(count, score)) {
				score = count;
				guess = answer;
			}
		});

		cb(null, guess);
	});
};

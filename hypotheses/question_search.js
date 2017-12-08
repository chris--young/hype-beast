'use strict'

const fs = require('fs');
const VError = require('verror');
const common = require('./common.js');
const JSDOM = require('jsdom').JSDOM;

module.exports = function (question, cb) {
	common.googleSearch(question.question, (err, body) => {
		if (err)
			return cb(new VError('Failed to search google'), null);;

		let max = 0;
		let guess = null;

		question.answers.forEach((answer, index) => {
			const regex = new RegExp(answer.text, 'gi');
			const count = (body.match(regex) || []).length;

			if (count >= max) {
				max = count;
				guess = answer;
			}
		});

		cb(null, guess);
	});
};

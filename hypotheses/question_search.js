'use strict'

const fs = require('fs');
const VError = require('verror');
const common = require('./common.js');
const _ = require('lodash');

module.exports = function (question, cb) {
	const not = /\bnot\b/i.test(question.question);

	common.googleSearch(question.question, (err, body) => {
		if (err)
			return cb(new VError('Failed to search google'), null);;

		let results = [];

		question.answers.forEach((answer, index) => {
			const regex = new RegExp(answer.text, 'gi');
			const count = (body.match(regex) || []).length;

			results.push({answer, index, count});
		});

		results = _.sortBy(results, (item) => - item.count);

		const recommend = not ? results.length - 1 : 0;

		_.each(results, (answer, index) => {
			answer.recommend = recommend === index;
		});

		cb(null, results);
	});
};

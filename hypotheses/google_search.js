'use strict'

const fs = require('fs');
const async = require('async');
const VError = require('verror');
const request = require('request');

const tie = (guess) => (
	guess[0].count === guess[1].count ||
	guess[1].count === guess[2].count ||
	guess[2].count === guess[0].count
);

function winner(guess) {
	let i = 0;

	guess.forEach((answer, index) => i >= 0 && (i = index));

	return guess[i];
}

module.exports = function (question, cb) {
	const not = /\bnot\b/i.test(question.question);
	const check = (count, score) => not ? count <= score : count >= score;

	googleSearch(question.question, 0, (err, res) => {
		if (err)
			return cb(new VError(err, 'Failed to search 1st google page'), null);

		const guess = [];

		question.answers.forEach((answer, index) => {
			const regex = new RegExp(answer.text, 'gi');
			const count = res.reduce((sum, body) => sum + (body.match(regex) || []).length, 0);

			guess.push = Object.assign(answer, { count });
		});

		if (!tie(guess))
			return cb(null, answer(guess));

		googleSearch(question.question, 1, (err, res) => {
			if (err)
				return cb(new VError(err, 'Failed to search 2nd google page'), null);

			question.answers.forEach((answer, index) => {
				const regex = new RegExp(answer.text, 'gi');
				const count = res.reduce((sum, body) => sum + (body.match(regex) || []).length, 0);

				guess[index].count += count;

				cb(null, answer(guess));
			});
		});
	});
};

function googleSearch(query, page, cb) {
	const opts = {
		method: 'GET',
		proxy: '52.168.84.238:1333',
		url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
	};

	if (page)
		opts.url += `&start=${page * 10}`;

	request(opts, (err, res, body) => {
		if (err)
			return cb(err, null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code: ${res.statusCode}`), body);

		cb(null, body);
	});
};

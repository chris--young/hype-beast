'use strict'

const fs = require('fs');
const VError = require('verror');
const request = require('request');
const cache = require('../data/cache.json');
const { debug } = require('../common.js');

const PAGES = 2;
const PROXY = process.env.HQ_PROXY_URL;

const sort = (a, b) => a.score < b.score ? 1 : a.score > b.score ? -1 : 0;
const range = (length) => Array(length).fill().map((_, index) => index);

module.exports = async function (question) {
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

	let pages = [];

	try {
		pages = await googleSearch(question.question, PAGES);
	} catch (e) {
		throw new VError(e, 'Failed to search google');
	}

	return guess(pages).sort(sort);
};

function googleSearch(query, pages = 1) {
	return Promise.all(range(pages).map((page) => new Promise((resolve, reject) => {
		const opts = {
			proxy: PROXY,
			method: 'GET',
			url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
		};

		if (page)
			opts.url += `&start=${(page) * 10}`;

		if (cache[opts.url])
			return setImmediate(() => debug(`Using cached version of ${opts.url}`) || resolve(cache[opts.url]));

		debug(`Skipping cache for ${opts.url}`);

		request(opts, (err, res, body) => {
			if (err)
				return reject(new VError(err, 'Failed to make request'), null);

			if (res.statusCode !== 200)
				return reject(new VError(`Got bad status code from google: ${res.statusCode}`));

			cache[opts.url] = body;

			fs.writeFile('./data/cache.json', JSON.stringify(cache, null, 2), (err) => err && warn('Failed to update cache', err));

			resolve(body);
		});
	})));
}

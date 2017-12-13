'use strict'

const fs = require('fs');
const VError = require('verror');
const request = require('request');

const cache = require('./data/cache.json');

const DEBUG = process.env.HQ_DEBUG;

const COLORS = {
	RED: '\x1b[31m',
	BLUE: '\x1b[36m',
	PINK: '\x1b[35m',
	GREEN: '\x1b[32m',
	WHITE: '\x1b[37m',
	YELLOW: '\x1b[33m',
};

const log = (...args) => console.log(COLORS.WHITE, ...args, '\x1b[0m');
const exit = (code, ...args) => console.error(COLORS.RED, ...args, '\x1b[0m') || process.exit(code);
const debug = (...args) => void (DEBUG && console.log(COLORS.GREEN, 'DEBUG:', ...args, '\x1b[0m'));
const warn = (...args) => console.error(COLORS.YELLOW, 'WARN:', ...args, '\x1b[0m');

Object.keys(COLORS).forEach((key) => log[key.toLowerCase()] = (...args) => console.log(COLORS[key], ...args, '\x1b[0m'));

exports.log = log;
exports.exit = exit;
exports.debug = debug;
exports.warn = warn;

const range = (length) => Array(length).fill().map((_, index) => index);

exports.googleSearch = (query, pages = 1) => Promise.all(range(pages).map((page) => new Promise((resolve, reject) => {
	const opts = {
		method: 'GET',
		url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
	};

	if (page)
		opts.url += `&start=${(page) * 10}`;

	if (cache[opts.url])
		return setImmediate(() => resolve(cache[opts.url]));

	request(opts, (err, res, body) => {
		if (err)
			return reject(new VError(err, 'Failed to make request'), null);

		if (res.statusCode !== 200)
			return reject(new VError(`Got bad status code from google: ${res.statusCode}`));

		cache[opts.url] = body;

		fs.writeFile('./data/cache.json', JSON.stringify(cache), (err) => err && warn('Failed to update cache', err));

		resolve(body);
	});
})));

exports.wikiSearch = (query, cb) => {
	const opts = {
		method: 'GET',
		url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
	};

	if (cache[opts.url])
		return setImmediate(() => cb(null, cache[opts.url]));

	request(opts, (err, res, body) => {
		if (err)
			return cb(new VError(err, 'Failed to make request'), null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code from wiki: ${res.statusCode}`), { headers: res.headers, body });

		cache[opts.url] = body;

		fs.writeFile('./data/cache.json', JSON.stringify(cache), (err) => err && warn('Failed to update cache', err));

		cb(null, body);
	});
};

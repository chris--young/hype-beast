'use strict'

const fs = require('fs');
const VError = require('verror');
const request = require('request');
const config = require('./config');

const cache = require('./data/cache.json');

const DEBUG = process.env.HQ_DEBUG;
const PROXY = process.env.HQ_PROXY_URL;

const NLP_API_KEY = config.get('google_nlp_api_key');

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
			return reject(new VError(err, 'Failed to make google request'), null);

		if (res.statusCode !== 200)
			return reject(new VError(`Got bad status code from google: ${res.statusCode}`));

		cache[opts.url] = body;

		fs.writeFile('./data/cache.json', JSON.stringify(cache), (err) => err && warn('Failed to update cache', err));

		resolve(body);
	});
})));

exports.wikiSearch = (query) => new Promise((resolve, reject) => {
	const opts = {
		proxy: PROXY,
		method: 'GET',
		url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
	};

	if (cache[opts.url])
		return setImmediate(() => debug(`Using cached version of ${opts.url}`) || resolve(cache[opts.url]));

	debug(`Skipping cache for ${opts.url}`);

	request(opts, (err, res, body) => {
		if (err)
			return reject(new VError(err, 'Failed to make wikipedia request'));

		if (res.statusCode !== 200)
			return reject(new VError(`Got bad status code from wikipedia: ${res.statusCode}`));

		cache[opts.url] = body;

		fs.writeFile('./data/cache.json', JSON.stringify(cache), (err) => err && warn('Failed to update cache', err));

		resolve(body);
	});
});

exports.analyzeSyntax = (sentence) => new Promise((resolve, reject) => {
	const opts = {
		method: 'POST',
		url: `https://language.googleapis.com/v1/documents:analyzeSyntax?key=${NLP_API_KEY}`,
		body: (JSON.stringify({
			document: {
				type: 'PLAIN_TEXT',
				content: sentence
			}
		}))
	}

	if (cache[sentence])
		return setImmediate(() => debug(`Using cached version of ${opts.url}`) || resolve(cache[sentence]));

	debug(`Skipping cache for ${sentence}`);

	request(opts, (err, res, body) => {
		if (err)
			return reject(new VError(err, 'Failed to make request to NLP'));

		if (res.statusCode !== 200)
			return reject(new VError(`Got bad status code from google: ${res.statusCode}`));

		try{
			body = JSON.parse(body);
		} catch(e) {
			return reject(new VError('Failed to parse body from NLP'));
		}

		cache[sentence] = body;

		fs.writeFile('./data/cache.json', JSON.stringify(cache), (err) => err && warn('Failed to update cache', err));

		return resolve(body);
	});
});
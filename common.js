'use strict'

const fs = require('fs');
const VError = require('verror');
const request = require('request');

const cache = require('./data/cache.json');

const DEBUG = process.env.HQ_DEBUG;
const PROXY = process.env.HQ_PROXY_URL;

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

exports.wikiSearch = (query, cb) => {
	const opts = {
		proxy: PROXY,
		method: 'GET',
		url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
	};

	if (cache[opts.url])
		return setImmediate(() => debug(`Using cached version of ${opts.url}`) || cb(null, cache[opts.url]));

	debug(`Skipping cache for ${opts.url}`);

	request(opts, (err, res, body) => {
		if (err)
			return cb(new VError(err, 'Failed to make request'), null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code from wiki: ${res.statusCode}`), { headers: res.headers, body });

		cache[opts.url] = body;

		fs.writeFile('./data/cache.json', JSON.stringify(cache, null, 2), (err) => err && warn('Failed to update cache', err));

		cb(null, body);
	});
};

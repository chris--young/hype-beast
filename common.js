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

const out = (m, c, s, o) => o ? console[m](c, s, o, '\x1b[0m') : console[m](c, s, '\x1b[0m');
const log = (msg, data) => out('log', COLORS.WHITE, msg, data);
const exit = (code, msg, data) => out('error', COLORS.RED, msg, data) || process.exit(code);
const debug = (msg, data) => void (DEBUG && out('log', COLORS.GREEN, `DEBUG: ${msg}`, data));
const warn = (msg, data) => out('error', COLORS.YELLOW, `WARN: ${msg}`, data);

Object.keys(COLORS).forEach((key) => log[key.toLowerCase()] = (msg, data) => out('log', COLORS[key], msg, data));

exports.log = log;
exports.exit = exit;
exports.debug = debug;
exports.warn = warn;

exports.googleSearch = (query, cb) => {
	const opts = {
		method: 'GET',
		url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
	};

	if (cache[opts.url])
		return setImmediate(() => cb(null, cache[opts.url]));

	request(opts, (err, res, body) => {
		if (err)
			return cb(new VError(err, 'Failed to make request'), null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code from google: ${res.statusCode}`), { headers: res.headers, body });

		cache[opts.url] = body;

		fs.writeFile('./data/cache.json', JSON.stringify(cache), (err) => err && warn('Failed to update cache', err));

		cb(null, body);
	});
};

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

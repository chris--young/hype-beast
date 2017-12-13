'use strict'

const VError = require('verror');
const request = require('request');

const DEBUG = process.env.HQ_DEBUG;

const COLORS = {
	RED: '\x1b[31m',
	BLUE: '\x1b[36m',
	PINK: '\x1b[35m',
	GREEN: '\x1b[32m',
	YELLOW: '\x1b[33m'
};

const out = (m, c, s, o) => o ? console[m](c, s, o, '\x1b[0m') : console[m](c, s, '\x1b[0m');

exports.log = (msg, data) => out('log', null, msg, data);
exports.exit = (code, msg, data) => out('error', COLORS.RED, msg, data) || process.exit(code);
exports.debug = (msg, data) => void (DEBUG && out('log', COLORS.GREEN, `DEBUG: ${msg}`, data));
exports.warn = (msg, data) => out('error', COLORS.YELLOW, `WARN: ${msg}`, data);

Object.keys(COLORS).forEach((key) => exports.log[key.toLowerCase()] = (msg, data) => out('log', COLORS[color], msg, data));

exports.googleSearch = (query, cb) => {
	const opts = {
		method: 'GET',
		url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
	};

	request(opts, (err, res, body) => {
		if (err)
			return cb(new VError(err, 'Failed to make request'), null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code from google: ${res.statusCode}`), { headers: res.headers, body });

		cb(null, body);
	});
};

exports.wikiSearch = (query, cb) => {
	const opts = {
		method: 'GET',
		url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
	};

	request(opts, (err, res, body) => {
		if (err)
			return cb(new VError(err, 'Failed to make request'), null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code from wiki: ${res.statusCode}`), { headers: res.headers, body });

		cb(null, body);
	});
};

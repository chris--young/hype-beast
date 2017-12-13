'use strict'

const VError = require('verror');
const request = require('request');

exports.googleSearch = (query, cb) => {
	const opts = {
		method: 'GET',
		url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
	};

	request(opts, (err, res, body) => {
		if (err)
			return cb(err, null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code from google: ${res.statusCode}`), body);

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
			return cb(err, null);

		if (res.statusCode !== 200)
			return cb(new VError(`Got bad status code from wiki: ${res.statusCode}`), body);

		cb(null, body);
	});
}

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
			return cb(new VError(`Got bad status code: ${res.statusCode}`), body);

		cb(null, body);
	});
};

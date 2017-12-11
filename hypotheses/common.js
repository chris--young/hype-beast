'use strict'

const VError = require('verror');
const request = require('request');
const async = require('async');

exports.googleSearch = (query, cb) => {
	const opts = {
		method: 'GET',
		url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
	};

	const getOpts = (page) => {
		const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${encodeURIComponent(page * 10)}`
		return { method: 'GET', url };
	};

	const search = (page, callback) => request(getOpts(page), (err, res, body) => {
		if (err)
			return callback(err, null);

		if (res.statusCode !== 200)
			return callback(new VError(`Got bad status code: ${res.statusCode}`), body);

		callback(null, body);
	});

	async.parallel([
		(callback) => search(0, callback),
		// (callback) => search(1, callback),
		// (callback) => search(2, callback),
		// (callback) => search(3, callback)
	], (err, results) => {
		if(err)
			return cb(err);
		return cb(null, results.join());
	});
};

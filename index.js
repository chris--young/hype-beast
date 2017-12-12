'use strict'

const _ = require('lodash');
const fs = require('fs');
const request = require('request');
const WebSocket = require('ws');
const VError = require('verror');
const googleSearch = require('./hypotheses/google_search.js');

const DEBUG = false;
const PING_INTERVAL = 10000;

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzNzMzOSwidXNlcm5hbWUiOiJjeW91bmciLCJhdmF0YXJVcmwiOm51bGwsInRva2VuIjpudWxsLCJyb2xlcyI6W10sImNsaWVudCI6ImlPUy8xLjIuMyBiNTciLCJpYXQiOjE1MDk5OTg3NjksImV4cCI6MTUxNzc3NDc2OSwiaXNzIjoiaHlwZXF1aXovMSJ9.M_ns3pAHPKb1ar5enRglWUycQEMXEdMjTUXoqCoc38U';

const exit = (code, msg, data) => (data ? console.error(msg, data) : console.error(msg)) || process.exit(code);
const debug = (msg, data) => void (DEBUG && (data ? console.log(`DEBUG: ${msg}`, data) : console.log(`DEBUG: ${msg}`)));
const warn = (msg, data) => data ? console.error(`WARN: ${msg}`, data) : console.error(`WARN: ${msg}`);

const token = parse(AUTH_TOKEN);

getShow((err, show) => {
	if (err || !show)
		exit(1, 'Failed to get show data', { err, show });

	if (!show.active)
		exit(2, `Next show at ${show.nextShowTime} with ${show.nextShowPrize} prize`);

	const opts = {
		perMessageDeflate: false,
		headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
	};

	console.log(`Connecting to broadcast ${show.broadcast.broadcastId}...`);

	const path = `./${show.broadcast.broadcastId}.stream`;
	const file = fs.createWriteStream(path, { flags: 'a' });
	const ws = new WebSocket(show.broadcast.socketUrl, opts);

	debug(`Logging stream to ${path}`);

	let ping = null;

	ws.on('open', () => {
		console.log(`Connection open\nPrize is $${show.prize}`);
		ping = setInterval(() => debug('ping...') || ws.ping('', false, false), PING_INTERVAL);
	});

	ws.on('pong', () => debug('...pong'));
	ws.on('message', (data) => handleMessage(data) || file.write(data + '\n'));
	ws.on('close', () => console.log('Connection closed') || (ping && clearInterval(ping)));
});

function handleMessage(msg) {
	try {
		msg = JSON.parse(msg);
	} catch (e) {
		return warn('Failed to parse message');
	}

	switch (msg.type) {
		case 'questionFinished':
		case 'questionClosed':
		case 'broadcastEnded':
		case 'broadcastStats':
		case 'gameSummary':
		case 'interaction':
		case 'gameStatus':
		case 'postGame':
		case 'kicked':
			if (DEBUG)
					console.log(msg);
			break;

		case 'question':
			console.log(msg);
			googleSearch(msg, (err, guess) => console.log('GUESS >', { err, guess }));
			break;

		case 'questionSummary':
			console.log(msg);
			break;

		default:
			warn(`Received unexpected message type: ${msg.type}`, msg);
	}
}

function getShow(cb) {
	const opts = {
		gzip: true,
		method: 'GET',
		uri: `https://api-quiz.hype.space/shows/now?type=hq&userId=${token.userId}`,
		headers: {
			Host: 'api-quiz.hype.space',
			'Accept-Encoding': 'br, gzip, deflate',
			Connection: 'keep-alive',
			Accept: '*/*',
			'User-Agent': 'hq-viewer/1.2.4 (iPhone; iOS 11.1.2; Scale/3.00)',
			'Accept-Language': 'en-US;q=1, es-MX;q=0.9',
			Authorization: `Bearer ${AUTH_TOKEN}`,
			'x-hq-client': 'iOS/1.2.4 b59'
		}
	};

	request(opts, (err, res, body) => {
		if (err)
			return cb(new VError(err, 'Failed to make request'), null);

		if (res.statusCode !== 200)
			return cb(new VError('Got bad response: %d', res.statusCode), body);

		try {
			body = JSON.parse(body);
		} catch (e) {
			return cb(new VError(e, 'Failed to parse response'), null);
		}

		cb(null, body);
	});
}

function parse(bearer) {
	try {
		const pieces = bearer.split('.');
		const token = new Buffer(pieces[1], 'base64').toString();

		return JSON.parse(token);
	} catch (e) {
		throw new VError(e, 'Failed to parse token');
	}
}

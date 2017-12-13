'use strict'

const _ = require('lodash');
const fs = require('fs');
const request = require('request');
const WebSocket = require('ws');
const VError = require('verror');
const questionSearch = require('./hypotheses/question_search.js');
const summaryProcess = require('./hypotheses/summary_process.js');
const distributionLock = require('./hypotheses/distribution_lock.js');

const DEBUG = false;
const PING_INTERVAL = 10000;

const AUTH_TOKEN = process.env.HQ_AUTH_TOKEN;

// global variables
const total = 12 // maybe get it from backend, since it might be 15 sometimes
const history = [0, 0, 0];

const exit = (code, msg, data) => (data ? console.error(msg, data) : console.error(msg)) || process.exit(code);
const debug = (msg, data) => void (DEBUG && (data ? console.log(`DEBUG: ${msg}`, data) : console.log(`DEBUG: ${msg}`)));
const warn = (msg, data) => data ? console.error(`WARN: ${msg}`, data) : console.error(`WARN: ${msg}`);

if (!AUTH_TOKEN)
	exit(1, '$HQ_AUTH_TOKEN undefined');

const token = parseToken(AUTH_TOKEN);

getShow((err, show) => {
	if (err || !show)
		exit(2, 'Failed to get show data', { err, show });

	if (!show.active)
		exit(3, `Next show at ${show.nextShowTime} with ${show.nextShowPrize} prize`);

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
			questionSearch(msg, (err, answers) => {
				if(err) {
					return console.log(err);
				}

				distributionLock(total, history, answers);

				console.log('RESULTS: ');
				console.log('\x1b[36m', answers, '\x1b[0m');
				return console.log('\x1b[35m', 'GUESS > ', _.find(answers, { recommend: true }).answer, '\x1b[0m');
			});
			break;

		case 'questionSummary':
			console.log(msg);
			summaryProcess(history, msg);
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
			return cb(new VError('Got bad response: %d', res.statusCode), { headers: res.headers, body });

		try {
			body = JSON.parse(body);
		} catch (e) {
			return cb(new VError(e, 'Failed to parse response'), null);
		}

		cb(null, body);
	});
}

function parseToken(bearer) {
	try {
		const raw = bearer.split('.')[1];
		const token = new Buffer(raw, 'base64').toString();

		return JSON.parse(token);
	} catch (e) {
		throw new VError(e, `Failed to parse token: ${bearer}`);;
	}
}

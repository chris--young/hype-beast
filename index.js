'use strict'

const fs = require('fs');
const request = require('request');
const WebSocket = require('ws');
const VError = require('verror');

const { questionSearch, summaryProcess, distributionLock } = require('./hypotheses');
const { exit, log, debug, warn } = require('./common');

const PING_INTERVAL = 10000;
const DEBUG = process.env.HQ_DEBUG;
const PROXY = process.env.HQ_PROXY_URL;
const AUTH_TOKEN = process.env.HQ_AUTH_TOKEN;
const NUM_QUESTIONS = 12 // maybe get it from backend, since it might be 15 sometimes

if (!AUTH_TOKEN)
	exit(1, '$HQ_AUTH_TOKEN undefined');

if (PROXY)
	debug(`Using proxy: ${PROXY}`);

const token = parseToken(AUTH_TOKEN);
const history = [0, 0, 0];

getShow()
	.then((show) => {
		if (!show.active)
			exit(3, `Next show at ${show.nextShowTime} with ${show.nextShowPrize} prize`);

		const opts = {
			perMessageDeflate: false,
			headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
		};

		log(`Connecting to broadcast ${show.broadcast.broadcastId}...`);

		if (!fs.existsSync('./data/broadcasts'))
			fs.mkdirSync('./data/broadcasts');

		const path = `./data/broadcasts/${show.broadcast.broadcastId}.txt`;
		const file = fs.createWriteStream(path, { flags: 'a' });
		const ws = new WebSocket(show.broadcast.socketUrl, opts);

		debug(`Logging stream to ${path}`);

		let ping = null;

		ws.on('open', () => {
			log(`Connection open\n Prize is $${show.prize}`);
			ping = setInterval(() => debug('ping...') || ws.ping('', false, false), PING_INTERVAL);
		});

		ws.on('pong', () => debug('...pong'));
		ws.on('message', (data) => handleMessage(data) || file.write(data + '\n'));
		ws.on('close', () => log('Connection closed') || (ping && clearInterval(ping)));
	})
	.catch((err) => exit(2, 'Failed to get show data', err));

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
			debug(msg);
			break;

		case 'question':
			log(msg);
			questionSearch(msg)
				.then((answers) => {
					distributionLock(NUM_QUESTIONS, history, answers);

					log('RESULTS: ');

					log.blue(answers);
					log.pink('GUESS > ', answers.find((answer) => answer.recommend).answer);
				})
				.catch((err) => warn(err));
			break;

		case 'questionSummary':
			log(msg);
			summaryProcess(history, msg);
			break;

		default:
			warn(`Received unexpected message type: ${msg.type}`, msg);
	}
}

function getShow() {
	return new Promise((resolve, reject) => {
		const opts = {
			gzip: true,
			proxy: PROXY,
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
				return reject(new VError(err, 'Failed to make request'));

			if (res.statusCode !== 200)
				return reject(new VError('Got bad response: %d', res.statusCode));

			try {
				body = JSON.parse(body);
			} catch (e) {
				return reject(new VError(e, 'Failed to parse response'));
			}

			if (!body)
				return reject(new VError('Show not found'));

			resolve(body);
		});
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

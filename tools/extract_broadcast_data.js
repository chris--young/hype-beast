'use strict'

const fs = require('fs');
const { exit } = require('../common');

const BROADCAST_ID = process.argv[2];

if (!BROADCAST_ID)
	exit(1, 'usage: node ./extract_broadcast_data <broadcastId>');

try {
	const stream = fs.readFileSync(`./data/broadcasts/${BROADCAST_ID}.txt`, 'utf8');
	const msgs = stream.split('\n').filter((l) => l).map((l) => JSON.parse(l));

	const questions = msgs.filter((msg) => msg.type === 'question');
	const summaries = msgs.filter((msg) => msg.type === 'questionSummary');

	fs.writeFileSync(`./data/questions/${BROADCAST_ID}.json`, JSON.stringify(questions, null, 2));
	fs.writeFileSync(`./data/summaries/${BROADCAST_ID}.json`, JSON.stringify(summaries, null, 2));
} catch (e) {
	exit(2, 'Failed to parse broadcast data', e);
}

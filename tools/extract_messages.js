'use strict'

const fs = require('fs');

if (process.argv.length < 4) {
	console.error('usage: node ./extract_messages <path_to_stream> <message_type>');
	process.exit(1);
}

const path = process.argv[2];
const type = process.argv[3];

try {
	const stream = fs.readFileSync(path, 'utf8');
	const msgs = stream.split('\n').filter((l) => l).map((l) => JSON.parse(l));
	const summaries = msgs.filter((msg) => msg.type === type);

	console.log(JSON.stringify(summaries, null, 2));
} catch (e) {
	console.error('Failed to parse stream record');
	process.exit(2);
}

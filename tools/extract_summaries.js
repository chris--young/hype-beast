'use strict'

const fs = require('fs');

if (process.argv.length < 3) {
	console.error('usage: node ./extract_summaries <file_path>');
	process.exit(1);
}

try {
	const stream = fs.readFileSync(process.argv[2], 'utf8');
	const msgs = stream.split('\n').filter((l) => l).map((l) => JSON.parse(l));
	const summaries = msgs.filter((msg) => msg.type === 'questionSummary');

	console.log(JSON.stringify(summaries, null, 2));
} catch (e) {
	console.error('Failed to parse stream record');
	process.exit(2);
}

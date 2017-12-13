'use strict'

const fs = require('fs');

const { exit, warn, log } = require('../common');
const { questionSearch } = require('../hypotheses');

const BROADCAST_ID = process.argv[2];

let files = fs.readdirSync('./data/questions');

if (BROADCAST_ID)
	files = files.filter((file) => file === `${BROADCAST_ID}.json`);

if (!files.length)
	exit(1, `Failed to find question data for broadcast: ${BROADCAST_ID}`);

const tests = files.map((file) => {
	const questions = require(`../data/questions/${file}`);
	const summaries = require(`../data/summaries/${file}`);

	const tasks = questions.map((question, index) => new Promise((resolve, reject) => {
		const summary = summaries[index];

		questionSearch(question, (err, answers) => {
			if (err)
				return reject(err);

			answers[0].correct = summary.answerCounts[answers[0].index].correct;

			resolve(answers[0]);
		});
	}));

	return Promise.all(tasks);
});

Promise.all(tests)
	.then((questions) => {
		let sum = 0;
		let correct = 0;

		questions.forEach((guesses) => guesses.forEach((result) => ++sum && (result.correct && ++correct)));

		log({ accuracy: correct / sum });
	})
	.catch((err) => warn(err));

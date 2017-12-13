'use strict'

const fs = require('fs');
const async = require('async');

const { exit, warn, log } = require('../common');
const { questionSearch } = require('../hypotheses');

let files = fs.readdirSync('./data/questions');

if (process.argv[2])
	files = files.filter((file) => file === `${process.argv[2]}.json`);

if (!files.length)
	exit(1, `Failed to find question data for broadcast: ${process.argv[2]}`);

async.parallel(files.map((file) => (cb) => {
	const questions = require(`../data/questions/${file}`);
	const summaries = require(`../data/summaries/${file}`);

	const tasks = questions.map((question, index) => (cb) => {
		const summary = summaries[index];

		questionSearch(question, (err, answers) => {
			if (err)
				return cb(err);

			answers[0].correct = summary.answerCounts[answers[0].index].correct;

			cb(null, answers[0]);
		});
	});

	async.parallel(tasks, cb);
}), (err, questions) => {
	if (err)
		return warn({ err });

	let sum = 0;
	let correct = 0;

	questions.forEach((guesses) => guesses.forEach((result) => ++sum && (result.correct && ++correct)));

	log({ accuracy: correct / sum });
});

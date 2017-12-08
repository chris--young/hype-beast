'use strict'

const fs = require('fs');
const async = require('async');
const questionSearch = require('../hypotheses/question_search.js');

const files = fs.readdirSync('./data/questions');

async.parallel(files.map((file) => (cb) => {
	const questions = require(`../data/questions/${file}`);
	const summaries = require(`../data/summaries/${file}`);

	const tasks = questions.map((question, index) => (cb) => {
		const summary = summaries[index];

		questionSearch(question, (err, guess) => {
			if (err)
				return cb(err);

			summary.answerCounts.forEach((answer) => (answer.answerId === guess.answerId) && cb(null, answer.correct));
		});
	});

	async.parallel(tasks, cb);
}), (err, questions) => {
	if (err)
		return console.error({ err });

	let sum = 0;
	let correct = 0;

	questions.forEach((guesses) => guesses.forEach((result) => ++sum && (result && ++correct)));

	console.log({ accuracy: correct / sum });
});

'use strict'

const fs = require('fs');
const async = require('async');

const { questionSearch } = require('../hypotheses');

const DELAY = 1000; // Prevents Google from rate limiting us

const files = fs.readdirSync('./data/questions');

async.series(files.map((file) => (cb) => {
	setTimeout(() => {
		const questions = require(`../data/questions/${file}`);
		const summaries = require(`../data/summaries/${file}`);

		const tasks = questions.map((question, index) => (cb) => {
			setTimeout(() => {
				const summary = summaries[index];

				questionSearch(question, (err, guess) => {
					if (err)
						return cb(err);

					if (!guess)
						return cb(null, false);

					summary.answerCounts.forEach((answer) => (answer.answerId === guess.answerId) && cb(null, answer.correct));
				});
			}, DELAY);
		});

		async.series(tasks, cb);
	}, DELAY);
}), (err, questions) => {
	if (err)
		return console.error({ err });

	let sum = 0;
	let correct = 0;

	questions.forEach((guesses) => guesses.forEach((result) => ++sum && (result && ++correct)));

	console.log({ accuracy: correct / sum });
});

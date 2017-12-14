'use strict'

const fs = require('fs');

const { exit, log } = require('../common');
const { questionSearch } = require('../hypotheses');

const files = fs.readdirSync('./data/questions');

const flatten = (array) => array.reduce((a, b) => a.concat(b), []);

const tests = files.map((file) => {
	const questions = require(`../data/questions/${file}`);
	const summaries = require(`../data/summaries/${file}`);

	const check = (index, answers) => summaries[index].answerCounts[answers[0].index].correct;
	const wrong = (index, answers) => check(index, answers) ? null : { summary: summaries[index], answers };

	const tasks = questions.map((question, index) => questionSearch(question).then((answers) => wrong(index, answers)));

	return Promise.all(tasks);
});

Promise.all(tests)
	.then((questions) => log(JSON.stringify(flatten(questions).filter((q) => q), null, 2)))
	.catch((err) => exit(1, 'Failed to get wrong answers', err));

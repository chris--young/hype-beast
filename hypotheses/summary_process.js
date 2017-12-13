'use strict'

const _ = require('lodash');

module.exports = (history, summary) => {
	const answers = _.sortBy(summary.answerCounts, ['answerId']);

	_.each(answers, (answer, index) => {
		if(answer.correct === true || answer.correct === 'true') {
			history[index] += 1;
			return false;
		}
	});
};
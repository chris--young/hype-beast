'use strict'

const threshold = 0.58
const _ = require('lodash');


// total: the total number of questions in this game, mostly 12
// history: [3, 2, 6]
// results: [{ans: 'blue', index: 2, count: 5}, {ans: 'yellow', index: 0, count: 3}, {ans: 'red', index: 1, count: 1}]
module.exports = (total, history, results) => {
	const limit = Math.floor(total * threshold);

	_.each(results, (choice, index) => {
		results[index].recommend = false;
		if(history[choice.index] + 1 <= limit) {
			results[index].recommend = true;
			return false;
		}
	});

	return results;
};
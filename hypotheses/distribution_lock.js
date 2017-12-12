'use strict'

const threshold = 0.58
const _ = require('lodash');


// total: the total number of questions in this game, mostly 12
// history: [3, 2, 6]
// results: [{ans: 'A', index: 0, count: 5}, {ans: 'B', index: 1, count: 3}, {ans: 'C', index: 2, count: 1}]
module.exports = (total, history, results) => {
	const limit = Math.floor(total * threshold);

	_.each(results, (choice, index) => {
		results[index].recommend = false;
		if(history[index] + 1 <= limit) {
			results[index].recommend = true;
			return false;
		}
	});

	return results;
};
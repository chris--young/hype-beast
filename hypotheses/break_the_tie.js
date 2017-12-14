'use strict'

const VError = require('verror');
const _ = require('lodash');

const { wikiSearch } = require('../common');

const prepare = (counts, question, not) => {
	const prepared = [];

	// Prepare
	counts.forEach((count, index) => {
		prepared.push({ 
			answer: question.answers[index],
			recommend: false,
			index,
			count,
		});
	});

	return prepared;
};

// count keywords in each answer search result
const getKeywordCounts = (results, keywordsReg) => results.map((result) => (result.match(keywordsReg) || []).length);

// add keywords count to each answer
const addKeywordsCounts = (answers, keywordCounts) => {
	keywordCounts.forEach((count, index) => {
		answers[index].count += keywordCounts[index] * 0.001; // a small difference is enough to break the tie
	});
};

module.exports = (counts, question, not, keywords) => new Promise((resolve, reject) => {
	let sameCountAnswers = 1;

	// Prepare Formated Answers
	let prepared = prepare(counts, question, not);
	prepared = _.sortBy(prepared, (answer) => not ? answer.count : - answer.count);

	// Find Answers with Same Counts
	let prevCount = prepared[0].count;
	prepared[0].recommend = true;
	for(let i = 1; i < prepared.length; i++){
		if(prepared[i].count === prevCount) {
			prepared[i].recommend = true;
			sameCountAnswers++;
		} else {
			break;
		}
	}

	// Not a Tie Situation
	if(sameCountAnswers === 1) {
		return setImmediate(() => resolve(prepared));
	}

	// Break the Tie
	const answersToSearch = [];
	const keywordsReg = new RegExp(keywords.join('|'), 'gi');

	for(let i = 0; i < sameCountAnswers; i++) {
		answersToSearch.push(prepared[i].answer.text);
	}

	Promise.all(answersToSearch.map((answerText) => wikiSearch(answerText)))
		.then((results) => {
			const keywordCounts = getKeywordCounts(results, keywordsReg);

			addKeywordsCounts(prepared, keywordCounts);

			// Sort Again
			prepared = _.sortBy(prepared, (answer) => not ? answer.count : - answer.count);
			// Reset .recommend field
			let recommendPicked = false;
			for(let i = 0; i < prepared.length; i++) {
				if(!recommendPicked && prepared[i].recommend) {
					recommendPicked = true;
				} else {
					prepared[i].recommend = false;
				}
			}

			return resolve(prepared);
		});
});
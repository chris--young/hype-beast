'use strict'

const common = require('../common.js');
const request = require('request');
const VError = require('verror');
const _ = require('lodash');


const TAG_FILTER = ['NOUN', 'ADJ', 'ADV', 'NUM'];
const NOISE_WORDS = ['not', 'never', 'what', 'how', 'when', 'why', 'where'];

const noiseReg = new RegExp(NOISE_WORDS.join("|"),"gi");

module.exports = (sentence) => common.analyzeSyntax(sentence).then((result) => {
	const tokens = _.filter(result.tokens, (token) => {
		if(noiseReg.test(_.get(token, 'text.content'))) {
			return false;
		}
		return TAG_FILTER.indexOf(_.get(token, 'partOfSpeech.tag')) >= 0;
	});

	const keywords = _.map(tokens, 'text.content');

	console.log(keywords);

	return keywords;
}).catch((err) => Promise.reject(new VError(err, 'Failed to do keywords extraction')));

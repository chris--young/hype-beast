'use strict'

const _ = require('lodash');

const replaces = ['what'];
const regex = new RegExp(replaces.join("|"),"gi");

module.exports = (question) => {
	const statement = question.question.replace('?', '');
	const statements = [];

	_.each(question.answers, (answer) => {
		statements.push(statement.replace(regex, answer));
	});

	return statements;
};
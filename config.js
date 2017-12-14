'use strict'

const _ = require('lodash');

const config = {
	google_nlp_api_key: 'AIzaSyCquHSznDmyinEbJ7kl5yFHthMq-wKxI14'
};

module.exports.get = (path) => _.get(config, path);
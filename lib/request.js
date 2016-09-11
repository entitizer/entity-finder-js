'use strict';

var utils = require('./utils');
var _ = utils._;
var Promise = utils.Promise;
var request = require('request');

module.exports = function(options) {
	options = _.defaults(options, {
		method: 'GET',
		json: true,
		encoding: 'utf8',
		headers: {
			'User-Agent': 'entity-finder'
		},
		timeout: 5 * 1000
	});

	// console.log('reqOptions', options);

	return new Promise(function(resolve, reject) {
		request(options, function(error, response, body) {
			if (error) {
				return reject(error);
			}
			resolve(body);
		});
	});
};

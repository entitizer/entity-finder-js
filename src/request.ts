'use strict';

const request = require('request');

import { _, Promise } from './utils';

export default function (options: any): Promise<any> {
	options = _.defaults(options, {
		method: 'GET',
		json: true,
		encoding: 'utf8',
		headers: {
			'User-Agent': 'entity-finder'
		},
		timeout: 5 * 1000
	});

	if (options.qs) {
		for (var prop in options.qs) {
			if (~[null].indexOf(options.qs[prop])) {
				delete options.qs[prop];
			}
		}
	}

	return new Promise(function (resolve, reject) {
		request(options, function (error, response, body) {
			if (error) {
				return reject(error);
			}
			resolve(body);
		});
	});
};

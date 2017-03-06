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

	return new Promise(function (resolve, reject) {
		request(options, function (error, response, body) {
			if (error) {
				return reject(error);
			}
			resolve(body);
		});
	});
};

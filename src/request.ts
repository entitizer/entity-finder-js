
const request = require('request');

export default function <T>(options: any): Promise<T> {
	options = Object.assign({}, options, {
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
		request(options, function (error: Error, _response: any, body: any) {
			if (error) {
				return reject(error);
			}
			resolve(body);
		});
	});
}

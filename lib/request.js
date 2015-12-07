'use strict';

var url = require('url');
var utils = require('./utils');
var _ = utils._;
var Promise = utils.Promise;

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

	var urlInfo = url.parse(options.url);
	// console.log('urlInfo 1', urlInfo);

	if (options.qs) {
		urlInfo.query = options.qs;
		urlInfo = url.format(urlInfo);
		// console.log('urlInfo 2', urlInfo);
		urlInfo = url.parse(urlInfo);
		// console.log('urlInfo 3', urlInfo);
	}

	var protocol = urlInfo.protocol.substr(0, urlInfo.protocol.length - 1);

	var request = require(protocol).request;

	var reqOptions = {
		host: urlInfo.host,
		port: protocol === 'https' ? 443 : 80,
		path: urlInfo.path,
		method: options.method,
		headers: options.headers
	};

	return new Promise(function(resolve, reject) {
		var timer, req, ended;

		function callReject(error) {
			if (!ended) {
				ended = true;
				clearTimeout(timer);
				reject(error);
			}
		}

		function callResolve(data) {
			if (!ended) {
				ended = true;
				clearTimeout(timer);
				resolve(data);
			}
		}

		function callTimeout() {
			if (req) {
				req.abort();
			}
			callReject(new Error('Request timeout!'));
		}

		timer = setTimeout(callTimeout, options.timeout);


		req = request(reqOptions, function(res) {
			res.setEncoding(options.encoding);
			var data = '';

			res.on('data', function(chunk) {
				data += chunk;
			});

			res.on('end', function() {
				if (!ended) {
					if (options.json) {
						try {
							data = JSON.parse(data);
						} catch (e) {
							return callReject(e);
						}
					}
					callResolve(data);
				}
			});

		});

		req.on('error', function(error) {
			callReject(error);
		});

		req.end();
	});
};

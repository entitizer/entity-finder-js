'use strict';

const utils = require('../utils');
const _ = utils._;
const request = require('../request');

const OPTIONS = {
	qs: {
		format: 'json'
	}
};

/**
 * Create request options: url, qs, headers
 */
function createOptions(lang, qs) {
	const options = {
		qs: _.defaults({}, qs || {}, OPTIONS.qs)
	};

	options.url = 'https://' + lang + '.wikipedia.org/w/api.php';

	return options;
}

const query = exports.query = function(lang, qs) {
	qs.action = 'query';

	const options = createOptions(lang, qs);

	return request(options);
};

exports.openSearch = function(lang, search, redirects) {
	const qs = {
		search: search,
		action: 'opensearch',
		redirects: redirects || 'resolve',
		suggest: true
	};

	const options = createOptions(lang, qs);

	return request(options);
};

exports.search = function(lang, srsearch) {
	const qs = {
		srsearch: srsearch,
		list: 'search',
		srprop: 'size'
	};

	return query(lang, qs);
};

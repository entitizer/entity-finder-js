'use strict';

var utils = require('../utils');
var _ = utils._;
var request = require('../request');

var OPTIONS = {
	qs: {
		format: 'json'
	}
};

/**
 * Create request options: url, qs, headers
 */
function createOptions(lang, qs) {
	var options = {
		qs: _.defaults({}, qs || {}, OPTIONS.qs)
	};

	options.url = 'https://' + lang + '.wikipedia.org/w/api.php';

	return options;
}

var query = exports.query = function(lang, qs) {
	qs.action = 'query';

	var options = createOptions(lang, qs);

	return request(options);
};

exports.openSearch = function(lang, search, redirects) {
	var qs = {
		search: search,
		action: 'opensearch',
		redirects: redirects || 'resolve',
		suggest: true
	};

	var options = createOptions(lang, qs);

	return request(options);
};

exports.search = function(lang, srsearch) {
	var qs = {
		srsearch: srsearch,
		list: 'search',
		srprop: 'size'
	};

	return query(lang, qs);
};

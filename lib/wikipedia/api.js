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

exports.openSearch = function(lang, search) {
	var qs = {
		search: search,
		action: 'opensearch'
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

exports.type = function(title) {
	return request({
			url: 'http://dbpedia.org/data/' + title.replace(/ /g, '_') + '.json',
			timeout: 8 * 1000,
			json: false
		})
		.then(function(body) {
			body = body || '';
			if (body.indexOf('http://dbpedia.org/ontology/Organisation') > 0) {
				return 'group';
			}
			if (body.indexOf('http://dbpedia.org/ontology/foundingDate') > 0) {
				if (body.indexOf('http://dbpedia.org/ontology/PopulatedPlace') > 0) {
					return 'place';
				}
				return 'group';
			}
			if (body.indexOf('http://dbpedia.org/ontology/Person') > 0) {
				return 'person';
			}
			if (body.indexOf('http://schema.org/Person') > 0) {
				return 'person';
			}
			if (body.indexOf('http://xmlns.com/foaf/0.1/Person') > 0) {
				return 'person';
			}
			if (body.indexOf('http://dbpedia.org/ontology/Place') > 0) {
				return 'place';
			}
			if (body.indexOf('http://dbpedia.org/ontology/PopulatedPlace') > 0) {
				return 'place';
			}
			if (body.indexOf('http://dbpedia.org/class/yago/GeoclassPopulatedPlace') > 0) {
				return 'place';
			}
			if (body.indexOf('http://dbpedia.org/class/yago/CommunesOf') > 0) {
				return 'place';
			}
		});
};

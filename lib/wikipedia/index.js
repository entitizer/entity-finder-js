'use strict';

const wikiApi = require('./api');
const pageDetails = require('./details');
const pageQuery = require('./page_query');

exports.api = wikiApi;

exports.pageQuery = pageQuery;

exports.pagesByTitles = function(titles, lang) {
	return pageQuery(lang, 'titles', titles);
};

exports.pagesByIds = function(ids, lang) {
	return pageQuery(lang, 'ids', ids);
};

exports.pageDetails = function(title) {
	return pageDetails(title)
		.catch(function(error) {
			if (!error.timeout) {
				throw error;
			}
		});
};

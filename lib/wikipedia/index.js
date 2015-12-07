'use strict';

var utils = require('../utils');
var wikiApi = require('./api');
var pageNormalize = require('./page_normalize');

function getPages(lang, refName, refValue) {
	var qs = {
		prop: 'extracts|categories|langlinks|redirects|info|pageimages|imageinfo|images',
		lllimit: 'max',
		rdlimit: 'max',
		redirects: true,
		explaintext: true,
		exsentences: 3
	};

	qs[refName] = refValue;

	return wikiApi.query(lang, qs)
		.then(function(result) {
			var pages = [];
			if (result && result.query && result.query.pages) {
				for (var pageId in result.query.pages) {
					var page = result.query.pages[pageId];
					pageNormalize(page);
					pages.push(page);
				}
			}

			return pages;
		});
}

exports.pagesByTitles = function(lang, titles) {
	return getPages(lang, 'titles', titles);
};

exports.pagesByIds = function(lang, ids) {
	return getPages(lang, 'ids', ids);
};

exports.pageType = function(title) {
	return wikiApi.type(title)
		.catch(utils.foo);
};

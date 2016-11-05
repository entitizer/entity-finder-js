'use strict';

const wikiApi = require('./api');
const pageNormalize = require('./page_normalize');

module.exports = function(lang, refName, refValue, qs) {
	qs = qs || {
		prop: 'extracts|categories|langlinks|redirects|info|pageimages|imageinfo|images|templates',
		lllimit: 'max',
		rdlimit: 'max',
		tllimit: 'max',
		redirects: true,
		explaintext: true,
		exsentences: 3
	};

	qs[refName] = refValue;

	return wikiApi.query(lang, qs)
		.then(function(result) {
			const pages = [];
			if (result && result.query && result.query.pages) {
				for (let pageId in result.query.pages) {
					const page = result.query.pages[pageId];
					pageNormalize(page);
					pages.push(page);
				}
			}

			return pages;
		});
};

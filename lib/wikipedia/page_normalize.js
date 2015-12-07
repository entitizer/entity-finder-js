'use strict';

var wikiData = require('wikipedia-data');
var utils = require('../utils');

function fixLanglinks(page) {
	page.langlinks = page.langlinks || [];

	page.langlinks.forEach(function(ll) {
		ll.title = ll.title || ll['*'];
		delete ll['*'];
	});
}

function fixDisambiguation(page) {
	var disCategory = wikiData.getDisambiguationCategories2()[page.pagelanguage];
	page.categories = page.categories || [];
	for (var i = page.categories.length - 1; i >= 0; i--) {
		if (page.categories[i].title === disCategory) {
			page.isDisambiguation = true;
			break;
		}
	}
}

function fixTitle(page) {
	var title = utils.formatTitle(page.title);
	if (title.specialTitle) {
		page.specialTitle = title.specialTitle;
		page.simpleTitle = title.simpleTitle;
		var disName = wikiData.getDisambiguationNames2()[page.pagelanguage];
		if (disName === title.specialTitle || disName.toLowerCase() === title.specialTitle) {
			page.isDisambiguation = page.hasDisambiguationTitle = true;
		}
	}
}

module.exports = function(page) {
	fixLanglinks(page);
	fixDisambiguation(page);
	fixTitle(page);
};

'use strict';

var wikiData = require('wikipedia-data');

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
	var result = /\(([^)]+)\)$/i.exec(page.title);
	if (result) {
		page.simpleTitle = page.title.substr(0, result.index).trimRight();
		var name = result[1];
		page.specialTitle = name;
		var disName = wikiData.getDisambiguationNames2()[page.pagelanguage];
		if (disName === name || disName.toLowerCase() === name) {
			page.hasDisambiguationTitle = true;
		}
	}
}

module.exports = function(page) {
	fixLanglinks(page);
	fixDisambiguation(page);
	fixTitle(page);
};

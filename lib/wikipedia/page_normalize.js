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
	if (!page.isDisambiguation) {
		var disCategory = wikiData.getDisambiguationCategories2()[page.pagelanguage];
		page.categories = page.categories || [];
		for (var i = page.categories.length - 1; i >= 0; i--) {
			if (page.categories[i].title === disCategory) {
				page.isDisambiguation = true;
				page.format = 'disambiguation';
				break;
			}
		}
	}
}

function fixTemplate(page) {
	if (page.templates && page.templates.length > 0) {
		var disName = ':' + wikiData.getDisambiguationNames2()[page.pagelanguage];
		for (var i = page.templates.length - 1; i >= 0; i--) {
			var t = page.templates[i];
			var i = t.title.indexOf(disName);
			if (i > 0 && i === t.title.length - disName.length) {
				page.isDisambiguation = true;
				page.format = 'disambiguation';
				// console.log(page.title, t.title, disName);
				return;
			}
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
	fixTemplate(page);
	fixDisambiguation(page);
	fixTitle(page);
};

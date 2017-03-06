'use strict';

const wikiData = require('wikipedia-data');
const utils = require('../utils');

function fixLanglinks(page) {
	page.langlinks = page.langlinks || [];

	page.langlinks.forEach(function(ll) {
		ll.title = ll.title || ll['*'];
		delete ll['*'];
	});
}

function fixDisambiguation(page) {
	if (!page.isDisambiguation) {
		const disCategory = wikiData.getDisambiguationCategories2()[page.pagelanguage];
		page.categories = page.categories || [];
		for (let i = page.categories.length - 1; i >= 0; i--) {
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
		const disName = ':' + wikiData.getDisambiguationNames2()[page.pagelanguage];
		for (let i = page.templates.length - 1; i >= 0; i--) {
			const t = page.templates[i];
			const index = t.title.indexOf(disName);
			if (index > 0 && index === t.title.length - disName.length) {
				page.isDisambiguation = true;
				page.format = 'disambiguation';
				// console.log(page.title, t.title, disName);
				return;
			}
		}
	}
}

function fixTitle(page) {
	const title = utils.formatTitle(page.title);
	if (title.specialTitle) {
		page.specialTitle = title.specialTitle;
		page.simpleTitle = title.simpleTitle;
		const disName = wikiData.getDisambiguationNames2()[page.pagelanguage];
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

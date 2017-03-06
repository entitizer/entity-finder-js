
const wikiData = require('wikipedia-data');
import { PageType, formatTitle } from '../utils';

function fixLanglinks(page) {
	page.langlinks = page.langlinks || [];

	page.langlinks.forEach(function (ll) {
		ll.title = ll.title || ll['*'];
		delete ll['*'];
	});
}

function fixDisambiguation(page: PageType) {
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

function fixTemplate(page: PageType) {
	if (page.templates && page.templates.length) {
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

function fixTitle(page: PageType) {
	const title = formatTitle(page.title);
	if (title.special) {
		page.specialTitle = title.special;
		page.simpleTitle = title.simple;
		const disName = wikiData.getDisambiguationNames2()[page.pagelanguage];
		if (disName === title.special || disName.toLowerCase() === title.special) {
			page.isDisambiguation = true;
		}
	}
}

export function normalize(page: PageType) {
	fixLanglinks(page);
	fixTemplate(page);
	fixDisambiguation(page);
	fixTitle(page);
};

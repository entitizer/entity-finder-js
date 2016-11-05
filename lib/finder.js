'use strict';

const utils = require('./utils');
const wikiData = require('wikipedia-data');
const wiki = require('./wikipedia');

function getDisambiguationNames(lang) {
	return wikiData.getDisambiguationNames2()[lang];
}

function filterOneWordName(name, title) {
	const wordsCount1 = utils.countWords(name);
	if (wordsCount1 === 1 && name.length !== title.length) {
		return false;
	}
	return true;
}

function isAbbr(name, title) {
	if (name === name.toUpperCase()) {
		const words = title.split(/[\s-]+/g);
		if (words.length >= name.length) {
			return true;
		}
	}

	return false;
}

function isComplex(name, title) {
	title = title.split(',');
	if (title.length > 1) {
		title = title[0];
		const wordsCount = utils.countWords(name);
		const titleWordsCount = utils.countWords(title);
		if (wordsCount === 1 && titleWordsCount === 1 && name.length === title.length) {
			return true;
		}
		if (wordsCount > 1 && wordsCount === titleWordsCount) {
			return true;
		}
	}

	return false;
}

function findTitles(name, lang, limit) {
	const wordsCount = utils.countWords(name);
	return wiki.api.openSearch(lang, name)
		.then(function(result) {
			const titles = [];
			for (let i = 0; i < limit && i < result[1].length; i++) {
				const title = utils.formatTitle(result[1][i]);
				title.description = result[2][i];
				// if (i === 0) {
				// 	titles.push(title);
				// 	continue;
				// }

				if (isAbbr(name, title.simpleTitle || title.title)) {
					titles.push(title);
					continue;
				}

				if (isComplex(name, title.simpleTitle || title.title)) {
					titles.push(title);
					continue;
				}

				if (!filterOneWordName(name, title.simpleTitle || title.title)) {
					continue;
				}

				const titleWordsCount = utils.countWords(title.title);

				if (title.simpleTitle) {
					const disName = getDisambiguationNames(lang);
					if (disName === title.specialTitle || disName.toLowerCase() === title.specialTitle) {
						continue;
					}
				} else {
					if (titleWordsCount !== wordsCount) {
						continue;
					}
				}
				titles.push(title);
			}
			return titles;
		});
}

exports.findTitles = function(name, lang, limit) {
	name = name.split('|')[0];

	return findTitles(name, lang, limit);
};

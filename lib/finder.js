'use strict';

const utils = require('./utils');
const _ = utils._;
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

function orderByTags(list, tags) {
	if (list.length > 1 && tags && tags.length > 0) {
		list = _.sortBy(list, (item) => {
			let score = 0;
			tags.forEach((tag) => {
				if (tag.test(item.title)) {
					score -= 2;
				}
				if (tag.test(item.description)) {
					score -= 1;
				}
			});
			return score;
		});
	}

	return list;
}

function findTitles(name, lang, limit, tags) {
	const wordsCount = utils.countWords(name);
	return wiki.api.openSearch(lang, name)
		.then(function(result) {
			const list = [];
			for (let i = 0; i < limit * 3 && i < result[1].length; i++) {
				const title = utils.formatTitle(result[1][i]);
				title.description = result[2][i];
				list.push(title);
			}
			return orderByTags(list, tags);
		})
		.then(function(list) {
			const titles = [];
			for (let i = 0; i < limit && i < list.length; i++) {
				const title = list[i];

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

exports.findTitles = function(name, lang, limit, tags) {
	name = name.split('|')[0];

	return findTitles(name, lang, limit, tags);
};

'use strict';

const debug = require('debug')('entity-finder');
const wikiData = require('wikipedia-data');

import * as utils from './utils';
import * as wiki from './wikipedia';
import { PageTitleType } from './types';

export type FindTitleOptionsType = {
	limit?: number,
	tags?: string[],
	profile?: string
}

export function findTitles(name: string, lang: string, options: FindTitleOptionsType = { limit: 2 }): Promise<PageTitleType[]> {
	name = name.split('|')[0];

	options.limit = options.limit || 2;

	const limit = options.limit;
	let tags: RegExp[];
	if (options.tags) {
		tags = options.tags.map((tag) => {
			return new RegExp('(^|\\b)' + tag + '(\\b|$)', 'gi');
		});
	}

	const wordsCount = utils.countWords(name);
	return wiki.api.openSearch(lang, name, { profile: options.profile, limit: limit + 2 })
		.then(function (result) {
			const list = [];
			for (let i = 0; i < result[1].length; i++) {
				const title = utils.formatTitle(result[1][i]);
				title.description = result[2][i];
				list.push(title);
			}
			debug('findTitles', name, lang, limit, tags);
			if (tags && tags.length) {
				return orderByTags(list, tags);
			}
			return list;
		})
		.then(function (list: PageTitleType[]) {
			debug('unfiltered titles', list);
			let titles = [];
			for (let i = 0; i < list.length; i++) {
				const title = list[i];

				if (isAbbr(name, title.simple || title.title)) {
					titles.push(title);
					continue;
				}

				if (isComplex(name, title.simple || title.title)) {
					titles.push(title);
					continue;
				}

				if (!filterOneWordName(name, title.simple || title.title)) {
					continue;
				}

				const titleWordsCount = utils.countWords(title.title);

				if (title.simple) {
					const disName = getDisambiguationNames(lang);
					if (disName === title.special || disName.toLowerCase() === title.special) {
						continue;
					}
				} else {
					if (titleWordsCount !== wordsCount) {
						continue;
					}
				}
				titles.push(title);
			}

			titles = titles.slice(0, limit);
			debug('filterd titles', titles);
			return titles;
		});
}

function getDisambiguationNames(lang) {
	return wikiData.getDisambiguationNames2()[lang];
}

function filterOneWordName(name: string, title: string) {
	const wordsCount1 = utils.countWords(name);
	if (wordsCount1 === 1 && name.length !== title.length) {
		return false;
	}
	return true;
}

function isAbbr(name: string, title: string) {
	if (name === name.toUpperCase()) {
		const words = title.split(/[\s-]+/g);
		if (words.length >= name.length) {
			return true;
		}
	}

	return false;
}

function isComplex(name: string, title) {
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

function orderByTags(list, tags?: RegExp[]): PageTitleType[] {
	// if (list.length > 1 && tags && tags.length > 0) {
	debug('Unordered by tags', utils._.map(list, 'title'));
	const sortList = list.filter((item, i) => {
		let score = 0;
		tags.forEach((tag) => {
			if (tag.test(item.title)) {
				score -= 2;
			}
			if (tag.test(item.description)) {
				score -= 1;
			}
		});
		if (score) {
			item.tempScore = score;
			item.tempIndex = i;
			return true;
		}
		return false;
	})
		.sort((a, b) => {
			return a.tempScore - b.tempScore;
		});

	if (sortList.length) {
		sortList.forEach(item => { list.splice(item.tempIndex, 1); });
		for (let i = sortList.length - 1; i >= 0; i--) {
			list.unshift(sortList[i]);
			delete sortList[i].tempScore;
			delete sortList[i].tempIndex;
		}
	}
	debug('Ordered by tags', utils._.map(list, 'title'));
	// }

	return list;
}
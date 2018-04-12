'use strict';

const debug = require('debug')('entity-finder');
const wikiData = require('wikipedia-data');

import * as wikiApi from './wikipedia/api';
import { PageTitle } from './types';
import { searchTitles, SearchTitleOptions } from './searchTitles';

export interface FindTitleOptions extends SearchTitleOptions {

}

export function findTitles(name: string, lang: string, options: FindTitleOptions)
	: Promise<PageTitle[]> {

	options = options || {};
	name = name.trim();
	lang = lang && lang.trim().toLowerCase() || 'en';

	const limit = options.limit || 2;
	const searchOptions: SearchTitleOptions = { limit: limit + 50, tags: options.tags };

	return searchTitles(name, lang, searchOptions)
		.then(titles => {
			titles = titles.slice(0, limit + 5);
			return filterDezambiguizationTitles(titles, lang)
				.then(filteredTitles =>
					titles.map(item => filteredTitles.find(it => it.title === item.title)).filter(item => !!item)
				)
		})
		.then(list => list.slice(0, limit))
}

function filterDezambiguizationTitles(pageTitles: PageTitle[], lang: string): Promise<PageTitle[]> {
	if (pageTitles.length === 0) {
		return Promise.resolve([]);
	}

	const titles = pageTitles.map(item => item.title).join('|');

	return wikiApi.query(lang, { titles: titles, prop: 'categories', clshow: '!hidden', cllimit: 50 })
		.then<PageTitle[]>(data => {
			if (!data.query) {
				return Promise.reject(new Error(JSON.stringify(data)))
			}
			data = data.query.pages;
			const filteredTitles = Object.keys(data)
				.map<{ pageid: number, title: string, categories: string[] }>(pageId => ({ pageid: data[pageId].pageid, title: data[pageId].title, categories: data[pageId].categories && data[pageId].categories.map((item: any) => item.title) }))
				.filter(item => !hasADezambiguizationCategory(item.categories, lang))
				.map(item => {
					const title = pageTitles.find(it => it.title === item.title);
					title.categories = item.categories;
					return title;
				});

			return filteredTitles;
		});
}

function hasADezambiguizationCategory(categories: string[], lang: string) {
	return categories && categories.findIndex(category => isDezambiguizationCategory(category, lang)) > -1;
}

function isDezambiguizationCategory(category: string, lang: string) {
	const disName = getDisambiguationName(lang);
	if (!disName) {
		throw new Error(`No Disambiguation Name for language ${lang}`);
	}
	const disNameReg = new RegExp('(^|\\b)' + disName + '(\\b|$)', 'i');
	const isDis = disNameReg.test(category);
	if (isDis) {
		debug(`Category ${category} is a dizambiguization`)
	}
	return isDis;
}

function getDisambiguationName(lang: string): string {
	return wikiData.getDisambiguationNames2()[lang];
}

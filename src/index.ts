'use strict';

const debug = require('debug')('entity-finder');

import { _, Promise, PageType } from './utils';
import * as wiki from './wikipedia';
import * as finder from './finder';

export const findTitles = finder.findTitles;

export type EntityType = {
	name: string,
	wikiId: number,
	wikiPage: PageType,
	description?: string,
	lang?: string,
	type?: string,
	types?: string[],
	names?: string[]
	props?: {},
	englishName?: string
};

export type OptionsType = {
	limit?: number,
	details?: boolean,
	filterDis?: boolean,
	filterDisDeep?: boolean,
	tags?: string[] | string
};

const OPTIONS: OptionsType = {
	limit: 2,
	details: true,
	filterDis: true,
	filterDisDeep: false,
	tags: null
};

function wikiPages(name: string, lang: string, options: OptionsType): Promise<PageType[]> {
	return wiki.pagesByTitles(name, lang)
		.then(function (pages) {
			return pages.filter(page => {
				return page.pageid && page.pageid > 0;
			});
		})
		.then(function (pages) {
			if (options.filterDis) {
				return pages.filter(function (page) {
					return !page.isDisambiguation;
				});
			}
			return pages;
		})
		.then(function (pages) {
			if (pages && pages.length > 1 && options.tags) {
				debug('sortBy', name, _.map(pages, 'title'));
				const titles = name.split('|');
				return _.sortBy(pages, (page) => {
					const index = titles.indexOf(page.title);
					return index > -1 ? index : 1000;
				});
			}

			return pages;
		});
}

function wikiPageDetails(page) {
	const entitle = _.find(page.langlinks, {
		lang: 'en'
	});
	if (entitle) {
		return wiki.pageDetails(entitle.title);
	}
}

function formatEntity(page, details) {
	const entity: EntityType = {
		name: page.title,
		wikiId: page.pageid,
		wikiPage: page,
		lang: page.pagelanguage
	};
	if (page.extract) {
		entity.description = page.extract;
	}

	if (details) {
		if (details.type) {
			entity.type = details.type;
		}
		if (details.types) {
			entity.types = details.types;
		}
		if (details.props && Object.keys(details.props).length > 0) {
			entity.props = details.props;
		}
	}

	if (page.redirects) {
		entity.names = [];
		page.redirects.forEach(function (item) {
			entity.names.push(item.title);
		});
	}

	if (entity.lang !== 'en' && page.langlinks) {
		const en = _.find(page.langlinks, {
			lang: 'en'
		});
		if (en) {
			entity.englishName = en.title;
		}
	}

	return entity;
}

function getWikiPageDetails(page, options) {
	if (options.details) {
		return wikiPageDetails(page);
	}
}

function passFilterByDis(page, options) {
	if (options.filterDisDeep && page.categories && page.categories.length > 0) {
		const title = _.take(_.pluck(page.categories, 'title'), 5).join('|');
		return wiki.pageQuery.query(page.pagelanguage, 'titles', title, {
			prop: 'info|categories|templates',
			tllimit: 'max'
		}).then(function (pages) {
			return !_.any(pages, {
				format: 'disambiguation'
			});
		});
	}
	return true;
}

function getEntities(name: string, lang: string, options: OptionsType): Promise<EntityType[]> {
	// options = _.defaults(options || {}, OPTIONS);
	const entities = [];
	return wikiPages(name, lang, options)
		.then(function (pages) {
			return Promise.each(pages, page => {
				if (entities.length === options.limit) {
					return null;
				}
				return Promise.props({
					details: getWikiPageDetails(page, options),
					passDis: passFilterByDis(page, options)
				})
					.then((props: any) => {
						if (props.passDis) {
							entities.push(formatEntity(page, props.details));
						} else {
							debug(page.title + ': didn`t pass filter');
						}
					});
			});
		})
		.then(function () {
			return entities;
		});
}

export function find(name: string, lang: string, options?: OptionsType): Promise<EntityType[]> {
	options = _.defaults(options || {}, OPTIONS);

	debug('options', options);
	debug('finding name:', name);

	if (typeof options.tags === 'string') {
		options.tags = [options.tags];
	}

	let tags: RegExp[];

	if (options.tags) {
		tags = options.tags.map((tag) => {
			return new RegExp('(^|\\b)' + tag + '(\\b|$)', 'gi');
		});
	}

	// console.log('find', name);

	return findTitles(name, lang, { limit: options.limit + 1, tags })
		.then(function (titles) {
			if (titles.length === 0) {
				titles = [{ title: name }];
				// return [];
			}

			name = _.pluck(titles, 'title').join('|');

			debug('finding titles:', name);

			return getEntities(name, lang, options)
				.then(function (entities) {
					entities.forEach(function (entity) {
						if (!entity.description) {
							const title = _.find(titles, {
								title: entity.name
							});
							if (title) {
								entity.description = title.description;
							}
						}
					});
					return entities;
				});
		});
}

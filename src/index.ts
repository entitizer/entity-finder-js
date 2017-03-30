'use strict';

const debug = require('debug')('entity-finder');

import { _, Promise } from './utils';
import { WikiEntitiesParams, getEntities, WikiEntity, ParamClaimsType } from 'wiki-entity';
import { findTitles, FindTitleOptionsType } from './find_titles';
import { filterWikiEntities } from './filters';

export { ParamClaimsType, WikiEntity }

export type FindOptions = {
	limit?: number;
	tags?: string[];
	claims?: ParamClaimsType;
	extract?: number;
	redirects?: boolean,
	types?: boolean | string[]
}

export function find(name: string, lang: string, options: FindOptions = {}): Promise<WikiEntity[]> {
	const limit = options.limit || 2;

	return findTitles(name, lang, { limit: limit + 2, tags: options.tags })
		.then(function (foundTitles) {
			if (foundTitles.length === 0) {
				return [];
			}

			const titles = foundTitles.map(title => title.title);
			debug('finding titles', titles);

			return getEntities({
				titles: titles.join('|'),
				language: lang,
				claims: options.claims,
				extract: options.extract,
				redirects: options.redirects,
				types: options.types
			})
				.then(filterWikiEntities)
				.then(entities => entities.slice(0, limit));
		});
}
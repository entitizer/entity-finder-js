'use strict';

const debug = require('debug')('entity-finder');

import { _, Promise } from './utils';
import { WikidataSimpleEntityType, EntityType } from './types';
import * as finder from './finder';

export * from './types';
export * from './finder';

export type FindOptions = {
	limit?: number,
	languages?: string[],
	claims?: boolean,
	props?: string[],
	tags?: string[]
}

export function find(name: string, lang: string, options: FindOptions = {}): Promise<EntityType[]> {
	const limit = options.limit || 2;

	return finder.findTitles(name, lang, { limit: limit, tags: options.tags })
		.then(function (foundTitles) {
			if (foundTitles.length === 0) {
				return [];
			}

			const titles = foundTitles.map(title => title.title);
			const languages = options.languages || [lang];

			return finder.findEntities({
				titles: titles,
				languages: languages,
				props: options.props
			}, { claims: options.claims });
		});

}
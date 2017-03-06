'use strict';

import * as wikiApi from './api';
import * as wikiPageDetails from './details';
import * as wikiPageQuery from './page_query';

export const api = wikiApi;
export const pageQuery = wikiPageQuery;

export function pagesByTitles(titles: string, lang: string) {
	return pageQuery.query(lang, 'titles', titles);
};

export function pagesByIds(ids: string, lang: string) {
	return pageQuery.query(lang, 'ids', ids);
};

export function pageDetails(title: string) {
	return wikiPageDetails.parse(title)
		.catch(function (error) {
			if (!error.timeout) {
				throw error;
			}
		});
};

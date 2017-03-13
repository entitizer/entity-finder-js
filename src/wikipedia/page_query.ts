
import { query as apiQuery } from './api';
import { normalize as pageNormalize } from './page_normalize';
import { Promise } from '../utils';
import { PageType } from '../types';

export function query(lang: string, refName: string, refValue: string, qs?: any): Promise<PageType[]> {
	qs = qs || {
		prop: 'extracts|categories|langlinks|redirects|info|pageimages|imageinfo|images|templates',
		lllimit: 'max',
		rdlimit: 'max',
		tllimit: 'max',
		redirects: true,
		explaintext: true,
		exsentences: 3
	};

	qs[refName] = refValue;

	return apiQuery(lang, qs)
		.then(function (result) {
			const pages: PageType[] = [];
			if (result && result.query && result.query.pages) {
				for (let pageId in result.query.pages) {
					const page = result.query.pages[pageId];
					pageNormalize(page);
					pages.push(page);
					// console.log(page);
				}
			}

			return pages;
		});
};

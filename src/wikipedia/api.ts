'use strict';

import { _, Promise } from '../utils';
import request from '../request';

const OPTIONS = {
	qs: {
		format: 'json'
	}
};

/**
 * Create request options: url, qs, headers
 */
function createOptions(lang, qs) {
	const options = {
		qs: _.defaults({}, qs || {}, OPTIONS.qs),
		url: 'https://' + lang + '.wikipedia.org/w/api.php'
	};

	return options;
}

export function query(lang: string, qs?: any): Promise<any> {
	qs.action = 'query';

	const options = createOptions(lang, qs);

	return request(options);
};

export function openSearch(lang: string, search: string, redirects?: string) {
	const qs = {
		search: search,
		action: 'opensearch',
		redirects: redirects || 'resolve',
		suggest: true,
		profile: 'fuzzy'
	};

	const options = createOptions(lang, qs);

	return request(options);
};

export function search(lang: string, srsearch: string) {
	const qs = {
		srsearch: srsearch,
		list: 'search',
		srprop: 'size'
	};

	return query(lang, qs);
};

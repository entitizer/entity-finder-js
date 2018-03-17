'use strict';

import request from '../request';

const OPTIONS = {
	qs: {
		format: 'json'
	}
};

/**
 * Create request options: url, qs, headers
 */
function createOptions(lang: string, qs: any): any {
	const options = {
		qs: Object.assign({}, qs || {}, OPTIONS.qs),
		url: 'https://' + lang + '.wikipedia.org/w/api.php'
	};

	return options;
}

export function query(lang: string, qs?: any): Promise<any> {
	qs.action = 'query';

	const options = createOptions(lang, qs);

	return request(options);
}

export function openSearch(lang: string, search: string,
	opts: { redirects?: string, limit?: number, profile?: string }): any {
	opts = opts || {};

	const qs = {
		search: search,
		action: 'opensearch',
		redirects: opts.redirects || 'resolve',
		suggest: true,
		profile: opts.profile || 'normal',
		limit: opts.limit || 10
	};

	const options = createOptions(lang, qs);

	return request(options);
}

export function search(lang: string, srsearch: string): any {
	const qs = {
		srsearch: srsearch,
		list: 'search',
		srprop: 'size'
	};

	return query(lang, qs);
}

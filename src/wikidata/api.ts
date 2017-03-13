'use strict';

import { _, Promise } from '../utils';
import request from '../request';
import {WikidataEntityType} from '../types';

const API_URL = 'https://www.wikidata.org/w/api.php';

export type GetEntitiesParamsType = {
    ids?: string[] | string,
    titles?: string[] | string,
    props?: string[] | string,
    languages?: string[] | string,
    sites?: string[] | string,
    sitefilter?: string[] | string,
    redirects?: string,
    format?: string
};

export type SearchEntitiesParamsType = {
    search: string,
    language: string,
    strictlanguage?: boolean,
    limit?: number,
    continue?: number,
    format?: string
};

export type WikidataSearchEntityType = {
    id: string;
    label?: string;
    pageid?: number;
    description?: string;
    aliases?: string[]
};

export function getEntities(params: GetEntitiesParamsType): Promise<WikidataEntityType[]> {
    const qs = {
        action: 'wbgetentities',
        ids: getStringArrayParam(params.ids),
        titles: getStringArrayParam(params.titles),
        props: getStringArrayParam(params.props),
        sites: getStringArrayParam(params.sites, 'enwiki'),
        languages: getStringArrayParam(params.languages),
        sitefilter: getStringArrayParam(params.sitefilter),
        redirects: params.redirects || 'yes',
        format: params.format || 'json'
    };

    // if (!qs.sites) {
    //     if (qs.languages) {
    //         qs.sites = qs.languages.split('|').map(l => l + 'wiki').join('|');
    //     } else {
    //         qs.sites = 'enwiki';
    //     }
    // }

    return request({ qs: qs, url: API_URL })
        .then(data => {
            if (hasError(data)) {
                return Promise.reject(getError(data));
            }
            if (data && data.entities) {
                return Object.keys(data.entities).map(id => data.entities[id]);
            }
            return null;
        });
};

export function searchEntities(params: SearchEntitiesParamsType): Promise<WikidataSearchEntityType[]> {
    const qs = {
        action: 'wbsearchentities',
        search: params.search,
        language: params.language,
        strictlanguage: params.strictlanguage,
        limit: params.limit,
        continue: params.continue,
        format: params.format || 'json'
    };

    return request({ qs: qs, url: API_URL })
        .then(data => {
            if (hasError(data)) {
                return Promise.reject(getError(data));
            }
            if (data && data.search) {
                return data.search;
            }
            return [];
        });
};

function getError(data: any): Error {
    return data && data.error && new Error(data.error.info || 'Wikidata Api Error') || new Error('NO error');
}

function hasError(data: any): boolean {
    return !!data.error;
}

function getStringArrayParam(value: string[] | string, def: string = null) {
    if (!value || value.length === 0) {
        return def;
    }
    if (!Array.isArray(value)) {
        value = [value];
    }

    return value.join('|');
}
'use strict';

import { _, Promise } from '../utils';
import request from '../request';

const API_URL = 'https://www.wikidata.org/w/api.php';

export type GetEntitiesType = {
    ids?: string[] | string,
    titles?: string[] | string,
    props?: string[] | string,
    languages?: string[] | string,
    sites?: string[] | string,
    sitefilter?: string[] | string,
    redirects?: string,
    format?: string
};

export function getEntities(params: GetEntitiesType): Promise<any> {
    const qs = {
        action: 'wbgetentities',
        ids: getStringArrayParam(params.ids),
        titles: getStringArrayParam(params.titles),
        props: getStringArrayParam(params.props),
        sites: getStringArrayParam(params.sites),
        languages: getStringArrayParam(params.languages),
        sitefilter: getStringArrayParam(params.sitefilter),
        redirects: params.redirects || 'yes',
        format: params.format || 'json'
    };

    if (!qs.sites) {
        if (qs.languages) {
            qs.sites = qs.languages.split('|').map(l => l + 'wiki').join('|');
        } else {
            qs.sites = 'enwiki';
        }
    }

    return request({ qs: qs, url: API_URL })
        .then(data => data && data.entities);
};


function getStringArrayParam(value: string[] | string, def: string = null) {
    if (!value || value.length === 0) {
        return def;
    }
    if (!Array.isArray(value)) {
        value = [value];
    }

    return value.join('|');
}
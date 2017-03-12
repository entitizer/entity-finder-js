
import { OptionsType as SimplifyClaimsOptionsType, simplifyClaims } from './simplify_claims';
import { _ } from '../utils';

export type SimplifyEntityOptionsType = {
    labels?: boolean;
    descriptions?: boolean;
    aliases?: boolean;
    sitelinks?: boolean;
    claims?: boolean | SimplifyClaimsOptionsType;
}

export type SimpleEntityType = {
    id: string;
    pageid?: number;
    lastrevid?: number;
    modified?: string;
    labels?: { [index: string]: string },
    descriptions?: { [index: string]: string },
    aliases?: { [index: string]: string[] },
    sitelinks?: { [index: string]: string },
    claims?: { [index: string]: any[] },
}

export function simplifyEntity(data: any, options: SimplifyEntityOptionsType
    = { labels: true, descriptions: true, aliases: true, sitelinks: true, claims: true }): SimpleEntityType {

    const entity: SimpleEntityType = { id: data.id };

    Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
            entity[key] = data[key];
        }
    });

    delete entity['title'];

    if (options.labels !== false && data.labels) {
        entity.labels = simplifyLabels(data.labels);
    }

    if (options.descriptions !== false && data.descriptions) {
        entity.descriptions = simplifyDescriptions(data.descriptions);
    }

    if (options.aliases !== false && data.aliases) {
        entity.aliases = simplifyAliases(data.aliases);
    }

    if (options.sitelinks !== false && data.sitelinks) {
        entity.sitelinks = simplifySitelinks(data.sitelinks);
    }

    if (options.claims !== false && data.claims) {
        entity.claims = simplifyClaims(data.claims, options.claims);
    }

    return entity;
}

export function simplifyAliases(data: any): { [index: string]: string[] } {
    return getManyLangValue(data);
}

export function simplifyDescriptions(data: any): { [index: string]: string } {
    return getLangValue(data);
}

export function simplifyLabels(data: any): { [index: string]: string } {
    return getLangValue(data);
}

export function simplifySitelinks(data: any): { [index: string]: string } {
    if (data) {
        const result = {};

        Object.keys(data).forEach(site => { result[site.replace(/wiki$/, '')] = data[site].title; });

        return result;
    }
    return null;
}

function getLangValue(data: any): { [index: string]: string } {
    if (data) {
        const result = {};

        Object.keys(data).forEach(lang => { result[lang] = data[lang].value; });

        return result;
    }
    return null;
}

function getManyLangValue(data: any): { [index: string]: string[] } {
    if (data) {
        const result = {};

        Object.keys(data).forEach(lang => { result[lang] = _.map(data[lang], 'value'); });

        return result;
    }
    return null;
}
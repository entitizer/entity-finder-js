
import { WikidataEntityClaimsType, WikidataEntityClaimType } from '../types';

export type OptionsType = {
    entityPrefix?: string;
    propertyPrefix?: string;
    // keepQualifiers?: boolean
};

// Expects an entity 'claims' object
// Ex: entity.claims
export function simplifyClaims(claims: any, opts: OptionsType = {}): WikidataEntityClaimsType {
    const simpleClaims = {};
    for (let id in claims) {
        let propClaims = claims[id];
        if (opts.propertyPrefix) {
            id = opts.propertyPrefix + ':' + id;
        }
        simpleClaims[id] = simplifyPropertyClaims(propClaims, opts);
    }
    return simpleClaims;
}

// Expects the 'claims' array of a particular property
// Ex: entity.claims.P369
export function simplifyPropertyClaims(propClaims: any[], opts: OptionsType = {}): WikidataEntityClaimType[] {
    return propClaims
        .map((claim) => simplifyClaim(claim, opts))
        .filter(nonNull)
}

// Expects a single claim object
// Ex: entity.claims.P369[0]
export function simplifyClaim(claim, opts: OptionsType = {}): WikidataEntityClaimType {
    // tries to replace wikidata deep claim object by a simple value
    // e.g. a string, an entity Qid or an epoch time number
    const { mainsnak, qualifiers } = claim

    // should only happen in snaktype: `novalue` cases or alikes
    if (mainsnak == null) return null

    const { datatype, datavalue } = mainsnak
    // known case: snaktype set to `somevalue`
    if (datavalue == null) return null

    let value = null

    switch (datatype) {
        case 'string':
        case 'commonsMedia':
        case 'url':
        case 'external-id':
            value = datavalue.value
            break
        case 'monolingualtext':
            value = datavalue.value.text
            break
        case 'wikibase-item':
            value = prefixedId(datavalue, opts.entityPrefix)
            break
        case 'wikibase-property':
            value = prefixedId(datavalue, opts.propertyPrefix)
            break
        case 'time':
            value = datavalue.value.time;
            break
        case 'quantity':
            value = parseFloat(datavalue.value.amount)
            break
        case 'globe-coordinate':
            value = getLatLngFromCoordinates(datavalue.value)
            break
    }

    // if (opts.keepQualifiers) {
    const simpleQualifiers = {}

    for (let qualifierProp in qualifiers) {
        simpleQualifiers[qualifierProp] = qualifiers[qualifierProp]
            .map(prepareQualifierClaim)
    }
    const result = {
        value,
        qualifiers: simplifyClaims(simpleQualifiers, opts)
    };
    if (Array.isArray(result) && result.length === 0 || Object.keys(result.qualifiers).length === 0) {
        delete result.qualifiers;
    }
    return result;
    // } else {
    //     return value
    // }
}

const prefixedId = function (datavalue, prefix) {
    const { id } = datavalue.value
    return typeof prefix === 'string' ? `${prefix}:${id}` : id
}

const getLatLngFromCoordinates = (value) => [value.latitude, value.longitude]

const prepareQualifierClaim = (claim) => ({ mainsnak: claim })
const nonNull = (obj) => obj != null

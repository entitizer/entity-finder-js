
import { getEntities, GetEntitiesParamsType } from './wikidata/api';
import { simplifyEntity, SimplifyEntityOptionsType, SimpleEntityType } from './wikidata/simplify_entity';
import { isWikidataId, Promise } from './utils';

export type FindEntitiesOptionsType = {
    simplify?: boolean | SimplifyEntityOptionsType,
    claims?: GetEntitiesParamsType
};

export function findEntities(params: GetEntitiesParamsType, options: FindEntitiesOptionsType = {}): Promise<SimpleEntityType[]> {

    return getEntities(params).then(function (entities) {
        if (!entities || entities.length < 1) {
            return entities;
        }

        entities = entities.filter(filterDezambiguisation);

        if (entities.length < 1) {
            return entities;
        }

        if (options.simplify !== false) {
            entities = entities.map(entity => simplifyEntity(entity, options.simplify));
            if (options.claims === true || typeof options.claims === 'object') {
                return Promise.map(entities, entity => findClaimsEntities(entity, options.claims));
            }
        }

        return entities;
    });
}

function findClaimsEntities(entity: SimpleEntityType, options?: GetEntitiesParamsType): Promise<SimpleEntityType> {
    if (!entity || !entity.claims) {
        return Promise.resolve(entity);
    }
    const claims = entity.claims;
    const ids = [];
    const paths = {};// id=[key:position]
    Object.keys(claims).forEach(property => {
        claims[property].forEach((claim, index) => {
            const id = claim.value || claim;
            if (isWikidataId(id)) {
                paths[id] = paths[id] || [];
                paths[id].push({ property, index });
                if (ids.indexOf(id) < 0) {
                    ids.push(id);
                }
            }
        });
    });

    // console.log('ids', ids);
    // console.log('paths', paths);
    // console.log('claims', claims);

    if (ids.length === 0) {
        return Promise.resolve(entity);
    }

    const params: GetEntitiesParamsType = { ids: ids, ...options };
    params.ids = ids;
    delete params.titles;

    // console.log('ids', ids.length);

    const idsSetsCount = (ids.length / 50) + 1;
    const paramsSets = [];
    for (var i = 0; i < idsSetsCount; i++) {
        var st = { ids: ids.slice(i * 50, (i + 1) * 50), ...options };
        if (st.ids.length > 0) {
            // console.log(st);
            paramsSets.push(findEntities(st));
        }
    }


    return Promise.all(paramsSets).then(arr => {
        arr.forEach(entities => {
            if (entities && entities.length) {
                entities.forEach(item => {
                    const pa = paths[item.id];
                    pa.forEach(pai => {
                        const it = claims[pai.property][pai.index];
                        if (it.value) {
                            it.value = item;
                        } else {
                            claims[pai.property][pai.index] = item;
                        }
                    });
                });
            }
        });

        return entity;
    });
}

/**
 * Filter entities thar are instances of disambiguation page.
 * @param entity Entity to test
 */
function filterDezambiguisation(entity: any): boolean {
    const disambiguationPageId = 'Q4167410';
    if (entity && entity.claims && entity.claims.P31) {
        const instanceOf = entity.claims.P31;
        for (var i = 0; i < instanceOf.length; i++) {
            var value = instanceOf[i];
            if (value === disambiguationPageId || value.mainsnak && value.mainsnak.datavalue && value.mainsnak.datavalue.value && value.mainsnak.datavalue.value.id === disambiguationPageId) {
                return false;
            }
        }
    }

    return true;
}

const debug = require('debug')('entity-finder');
import { WikiEntity } from 'wiki-entity';

/**
 * Filter entities thar are instances of disambiguation page.
 * @param entity Entity to test
 */
export function filterWikiEntity(entity: WikiEntity): boolean {
    if (!entity) {
        return false;
    }

    const disambiguationPageId = 'Q4167410';
    const disambiguationPageDescription = 'Wikimedia disambiguation page';

    if (entity.description && entity.description === disambiguationPageDescription) {
        debug('filtered by description', entity.label);
        return false;
    }
    if (entity.claims && entity.claims.P31) {
        const instanceOf = entity.claims.P31.values;
        for (var i = 0; i < instanceOf.length; i++) {
            var value = instanceOf[i];
            if (value.value === disambiguationPageId) {
                debug('filtered by P31', entity.label);
                return false;
            }
        }
    }

    return true;
}

export function filterWikiEntities(entities: WikiEntity[]): WikiEntity[] {
    return entities.filter(filterWikiEntity);
}

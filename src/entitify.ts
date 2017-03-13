
import { WikidataSimpleEntityType, EntityType } from './types';

export function entitify(wikiEntity: WikidataSimpleEntityType): EntityType {
    const entity: EntityType = { id: wikiEntity.id };

    for (var prop in wikiEntity) {
        entity[prop] = wikiEntity[prop];
    }

    delete entity.type;
    delete entity['ns'];

    return entity;
}

function setType() {

}
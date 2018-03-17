
const atonic = require('atonic');
import * as utils from './utils';

export function startsWith(text: string, start: string) {
    text = atonic.lowerCase(text.trim().toLowerCase()).replace(/[,-]+/g, ' ').trim();
    start = atonic.lowerCase(start.trim().toLowerCase()).replace(/[,-]+/g, ' ').trim();
    return text.indexOf(start) === 0;
}

export function containsWords(text: string, search: string) {
    text = atonic.lowerCase(text.trim().toLowerCase());
    search = atonic.lowerCase(search.trim().toLowerCase());
    const textWords = text.split(/[\s,-]+/g);
    const searchWords = search.split(/[\s,-]+/g);

    for (let word of searchWords) {
        if (!textWords.find(tw => tw.startsWith(word))) {
            return false;
        }
    }
    return true;
}

export function filterOneWordName(name: string, title: string) {
    const wordsCount = utils.countWords(name);
    if (wordsCount === 1 && name.length !== title.length) {
        return false;
    }
    return true;
}

export function isAbbr(name: string, title: string) {
    // if (name === name.toUpperCase()) {
    const words = title.split(/[\s-]+/g);
    if (words.length >= name.length) {
        return true;
    }
    // }

    return false;
}

export function isComplex(name: string, title: string) {
    const titleParts = title.split(',');
    if (titleParts.length > 1) {
        title = titleParts[0];
        const wordsCount = utils.countWords(name);
        const titleWordsCount = utils.countWords(title);
        if (wordsCount === 1 && titleWordsCount === 1 && name.length === title.length) {
            return true;
        }
        if (wordsCount > 1 && wordsCount === titleWordsCount) {
            return true;
        }
    }

    return false;
}

// const debug = require('debug')('entity-finder');
// import { WikiEntity } from 'wiki-entity';

// /**
//  * Filter entities thar are instances of disambiguation page.
//  * @param entity Entity to test
//  */
// export function filterWikiEntity(entity: WikiEntity): boolean {
//     if (!entity) {
//         return false;
//     }

//     const disambiguationPageId = 'Q4167410';
//     const disambiguationPageDescription = 'Wikimedia disambiguation page';

//     if (entity.description && entity.description === disambiguationPageDescription) {
//         debug('filtered by description', entity.label);
//         return false;
//     }
//     if (entity.claims && entity.claims.P31) {
//         const instanceOf = entity.claims.P31.values;
//         for (var i = 0; i < instanceOf.length; i++) {
//             var value = instanceOf[i];
//             if (value.value === disambiguationPageId) {
//                 debug('filtered by P31', entity.label);
//                 return false;
//             }
//         }
//     }

//     return true;
// }

// export function filterWikiEntities(entities: WikiEntity[]): WikiEntity[] {
//     return entities.filter(filterWikiEntity);
// }

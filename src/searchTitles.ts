'use strict';

const debug = require('debug')('entity-finder');
const wikiData = require('wikipedia-data');

import * as wikiApi from './wikipedia/api';
import { PageTitle } from './types';

export interface SearchTitleOptions {
    limit?: number
    tags?: string[] | string
}

export function searchTitles(name: string, lang: string, options: SearchTitleOptions)
    : Promise<PageTitle[]> {

    lang = lang.trim().toLowerCase();
    options = options || {};
    name = name.trim();

    const limit = options.limit || 2;
    const openSearchOptions = { limit: limit };

    return wikiApi.openSearch(lang, name, openSearchOptions)
        .then((result: any) => {
            const list = [];
            for (let i = 0; i < result[1].length; i++) {
                const title = formatTitle(result[1][i]);
                title.description = result[2][i];
                list.push(title);
            }
            debug('findTitles', name, lang, limit);
            return orderByTags(list, options.tags);
        })
        .then((list: PageTitle[]) => {
            debug('unfiltered titles', list);
            let titles = [];
            for (let i = 0; i < list.length; i++) {
                const title = list[i];

                // if (isAbbr(name, title.simple || title.title)) {
                //     titles.push(title);
                //     continue;
                // }

                // if (isComplex(name, title.simple || title.title)) {
                //     titles.push(title);
                //     continue;
                // }

                // if (!filterOneWordName(name, title.simple || title.title)) {
                //     continue;
                // }

                if (title.simple) {
                    const disName = getDisambiguationNames(lang);
                    debug(`special name ${title.special} -> ${disName}`)
                    if (disName.toLowerCase() === title.special.toLowerCase()) {
                        continue;
                    }
                }
                // else {
                //     const titleWordsCount = utils.countWords(title.title);
                //     if (titleWordsCount !== wordsCount && !startsWith(title.title, name) && !containsWords(title.title, name)) {
                //         continue;
                //     }
                // }
                titles.push(title);
            }

            titles = titles.slice(0, limit);
            debug('filterd titles', titles);
            return titles;
        });
}

function formatTitle(title: string): PageTitle {
    var result = /\(([^)]+)\)$/i.exec(title);
    const pageTitle: PageTitle = {
        title: title
    };
    if (result) {
        pageTitle.simple = pageTitle.title.substr(0, result.index).trim();
        pageTitle.special = result[1];
    }

    return pageTitle;
}

function getDisambiguationNames(lang: string): string {
    return wikiData.getDisambiguationNames2()[lang];
}

function orderByTags(list: any[], tags: string | string[]): PageTitle[] {
    if (!tags) {
        return list;
    }
    if (!Array.isArray(tags)) {
        tags = [tags];
    }

    let regTags = tags.map((tag) => new RegExp('(^|\\b)' + tag + '(\\b|$)', 'i'));

    // if (list.length > 1 && tags && tags.length > 0) {
    debug('Unordered by tags', list.map(item => item.title), tags);
    const selectedList = list.filter((item) => {
        let score = 0;
        regTags.forEach((tag) => {
            if (tag.test(item.title)) {
                score += 5;
            }
            if (tag.test(item.description)) {
                score += 1;
            }
        });
        item.tempScore = score;
        if (score !== 0) {
            return true;
        }
        return false;
    })
        .sort((a, b) => {
            return b.tempScore - a.tempScore;
        })
        .map(item => {
            delete item.tempScore;
            return item;
        });

    if (selectedList.length) {
        list = list.filter(item => !selectedList.find(it => it.title === item.title));
        list = selectedList.concat(list);
    }

    debug('Ordered by tags', list.map(item => item.title));
    // }

    return list;
}

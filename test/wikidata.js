'use strict';

const api = require('../lib/wikidata/api');
const simplifyEntity = require('../lib/wikidata/simplify_entity');
const findEntities = require('../lib/find_entities');
const findTitles = require('../lib/find_titles');
const assert = require('assert');
const request = require('request');
const utils = require('../lib/utils');

describe('wikidata', function () {
    it('getEntities', function () {
        return api.getEntities({
            titles: 'Vladimir Voronin',
            sites: 'rowiki',
            languages: ['ro', 'en', 'ru']
        })
            .then(function (entities) {
                assert.equal(1, entities.length);
                // console.log(entities);
            });
    });

    it('findEntities', function () {
        this.timeout(1000 * 5);

        return findTitles.findTitles('r. moldova', 'ro', { limit: 4 })
            .then(function (titles) {
                titles = utils._.map(titles, 'title');
                return findEntities.findEntities({ titles: titles, languages: ['ro', 'en', 'ru'], sites: ['rowiki'] },
                    { simplify: { claims: true }, claims: { languages: ['ro', 'en', 'ru'], sites: ['enwiki'], props: ['info', 'labels', 'aliases', 'datatype', 'descriptions'] } })
                    .then(function (entities) {
                        assert.equal(1, entities.length);
                        // console.log(JSON.stringify(entities[0]));
                    });
            });
    });
});

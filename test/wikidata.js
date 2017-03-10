'use strict';

const api = require('../lib/wikidata/api');
const simplifyEntity = require('../lib/wikidata/simplify_entity');
const assert = require('assert');
const request = require('request');

describe('wikidata', function () {
    it('getEntities', function () {
        return api.getEntities({
            titles: 'Vladimir Voronin',
            sites: 'rowiki',
            languages: ['ro', 'en', 'ru']
        })
            .then(function (entities) {
                Object.keys(entities).forEach(id => {
                    console.log('entity ' + id, simplifyEntity.simplifyEntity(entities[id]));
                });
            });
    });
});

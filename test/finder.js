'use strict';

var assert = require('assert');
var finder = require('../lib');

describe('finder', function () {
	describe('#find', function () {
		it('should find entity type', function () {
			return finder.find('R. Moldova', 'ro', {
				limit: 1
			})
				.then(function (entities) {
					// console.log('Moldova entities', entities);
					assert.equal(1, entities.length);
					assert.equal('Republica Moldova', entities[0].sitelinks.ro);
					// assert.equal('place', entities[0].type);
					// assert.equal('ro', entities[0].lang);
				});
		});

		it('should filter Disambiguation entity', function () {
			const name = 'Adrian Ursu';
			return finder.find(name, 'ro', { limit: 4 })
				.then(function (entities) {
					// console.log('Adrian Ursu entities', entities);
					assert.equal(2, entities.length);
					assert.equal(name + ' ', entities[0].sitelinks.ro.substr(0, name.length + 1));
					assert.equal(name + ' ', entities[1].sitelinks.ro.substr(0, name.length + 1));
					// assert.equal('jurnalist', entities[0].wikiPage.specialTitle);
					// assert.equal('person', entities[0].type);
					// assert.equal('cântăreț', entities[1].wikiPage.specialTitle);
					// assert.equal('person', entities[1].type);
				});
		});

		it('should order entities by tags score', function () {
			const name = 'Adrian Ursu';
			return finder.find(name, 'ro', { tags: 'moldova', limit: 1 })
				.then(function (entities) {
					// console.log('Adrian Ursu entities', entities);
					assert.equal(1, entities.length);
					assert.equal(name + ' (cântăreț)', entities[0].sitelinks.ro);
					// assert.equal('jurnalist', entities[1].wikiPage.specialTitle);
					// assert.equal('cântăreț', entities[0].wikiPage.specialTitle);
					// assert.equal('person', entities[1].type);
				});
		});

		it('should (NOT?) find a complex entity!!!', function () {
			return finder.find('Adrian Ursu cântăreț', 'ro')
				.then(function (entities) {
					// console.log('Adrian Ursu entities', entities);
					assert.equal(1, entities.length);
					// assert.equal('cântăreț', entities[0].wikiPage.specialTitle);
					// assert.equal('person', entities[0].type);
				});
		});

		it('should NOT find Disambiguation entity title', function () {
			return finder.find('Moldova (dezambiguizare)', 'ro')
				.then(function (entities) {
					// console.log('Moldova (dezambiguizare) entities', entities);
					assert.equal(0, entities.length);
					// assert.equal('Moldova (dezambiguizare)', entities[0].name);
				});
		});

		it('should find abbr entity title', function () {
			return finder.find('PLDM', 'ro')
				.then(function (entities) {
					// console.log('PLDM entities', entities);
					assert.equal(1, entities.length);
					// assert.equal('org', entities[0].type);
				});
		});

		it('should find short name entity title', function () {
			return finder.find('Ministerul Educatiei', 'ro')
				.then(function (entities) {
					// console.log('Ministerul Educatiei entities', entities);
					assert.equal(2, entities.length);
					// console.log(entities);
					// assert.equal('org', entities[0].type);
					// assert.equal('org', entities[1].type);
				});
		});

		it('should find short name entity title', function () {
			return finder.find('NATO', 'ro')
				.then(function (entities) {
					// console.log('NATO entities', entities);
					assert.equal(1, entities.length);
					// assert.equal('org', entities[0].type);
				});
		});

		it('should omit Disambiguation pages', function () {
			return finder.find('Butuceni', 'ro')
				.then(function (entities) {
					// console.log('Butuceni entities', entities);
					assert.equal(2, entities.length);
					// assert.equal('place', entities[0].type);
				});
		});

		it('should order entities by tags score', function () {
			return finder.find('Ministry of External Affairs', 'en', { tags: 'Soviet Union', limit: 1 })
				.then(function (entities) {
					// console.log('entities', entities);
					assert.equal(true, entities[0].sitelinks.en.indexOf('Soviet Union') > 0);
				});
		});

		it('ro:ro:adrian ursu', function () {
			return finder.find('adrian ursu', 'ro', { tags: 'jurnalist', limit: 1 })
				.then(function (entities) {
					assert.equal(true, entities[0].sitelinks.ro.indexOf('jurnalist') > 0);
				});
		});
	});
});

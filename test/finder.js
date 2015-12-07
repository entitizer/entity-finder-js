'use strict';

var assert = require('assert');
var finder = require('../lib');

describe('finder', function() {
	describe('#find', function() {
		it('should find entity type', function() {
			return finder.find('Moldova', 'ro')
				.then(function(entities) {
					assert.equal(1, entities.length);
					assert.equal('place', entities[0].type);
				});
		});

		it('should find Disambiguation entity', function() {
			return finder.find('Adrian Ursu', 'ro')
				.then(function(entities) {
					assert.equal(1, entities.length);
					assert.equal(true, entities[0].isDisambiguation);
				});
		});

		it('should find Disambiguation entity title', function() {
			return finder.find('Moldova (dezambiguizare)', 'ro')
				.then(function(entities) {
					assert.equal(1, entities.length);
					assert.equal(true, entities[0].isDisambiguation);
					assert.equal(true, entities[0].hasDisambiguationTitle);
					assert.equal('Moldova', entities[0].simpleTitle);
					assert.equal('dezambiguizare', entities[0].specialTitle);
				});
		});
	});
});

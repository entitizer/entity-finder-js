'use strict';

var assert = require('assert');
var pageDetails = require('../lib/wikipedia/details');

describe('page details', function() {
	it('n3:should parse a person', function() {
		return pageDetails('Vlad Filat', { timeout: 20 * 1000 })
			.then(function(details) {
				// console.log(details);
				assert.equal('person', details.type);
			});
	});
	it('json:should parse a person', function() {
		return pageDetails('Vlad Filat', { timeout: 20 * 1000 }, 'json')
			.then(function(details) {
				assert.equal('person', details.type);
			});
	});
	it('n3:should parse a place: Moscow', function() {
		return pageDetails('Moscow', { timeout: 20 * 1000 })
			.then(function(details) {
				// console.log(details);
				assert.equal('place', details.type);
			});
	});
	it('json:should parse a place: Moscow', function() {
		return pageDetails('Moscow', { timeout: 20 * 1000 }, 'json')
			.then(function(details) {
				// console.log(details);
				assert.equal('place', details.type);
			});
	});

	it('n3:should parse a group: Ministry of Education (Moldova)', function() {
		return pageDetails('Ministry of Education (Moldova)', { timeout: 20 * 1000 })
			.then(function(details) {
				assert.ok(details);
				// console.log(details);
				// assert.equal('place', details.type);
			});
	});
});

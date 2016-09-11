'use strict';

var assert = require('assert');
var pageDetails = require('../lib/wikipedia/page_details');

describe('page details', function() {
	it('should parse a person', function() {
		return pageDetails('Vlad_Filat', { timeout: 20 * 1000 })
			.then(function(details) {
				// console.log(details);
				assert.equal('person', details.type);
				assert.equal('Filat', details.surname);
			});
	});
});

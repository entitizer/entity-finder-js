'use strict';

var assert = require('assert');
var request = require('../lib/request');

describe('request', function() {
	it('should parse qs', function() {
		return request({
			url: 'https://en.wikipedia.org/w/api.php',
			qs: {
				action: 'opensearch',
				format: 'json',
				search: 'obama'
			}
		});
	});
});

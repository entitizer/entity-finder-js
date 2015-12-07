'use strict';

var request = require('../request');
var utils = require('../utils');
var _ = utils._;

function resourceNameParser(resource) {
	return resource.replace('http://dbpedia.org/resource/', '');
}

var DETAILS = {
	'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': [{
		match: {
			value: [
				'http://dbpedia.org/ontology/Country',
				'http://dbpedia.org/ontology/Place',
				'http://schema.org/Place',
				'http://dbpedia.org/ontology/PopulatedPlace',
				// 'http://dbpedia.org/class/yago/YagoPermanentlyLocatedEntity',
				'http://dbpedia.org/class/yago/YagoGeoEntity'
			]
		},
		prop: 'type',
		value: 'place'
	}, {
		match: {
			value: [
				'http://dbpedia.org/class/yago/LivingPeople',
				'http://dbpedia.org/ontology/Person',
				'http://xmlns.com/foaf/0.1/Person',
				'http://schema.org/Person'
			]
		},
		prop: 'type',
		value: 'person'
	}, {
		match: {
			value: [
				'http://dbpedia.org/ontology/Organisation',
				'http://dbpedia.org/ontology/Company',
				'http://schema.org/Organization',
				'http://umbel.org/umbel/rc/Organization',
				/^http:\/\/dbpedia.org\/class\/yago\/SocialGroup\d+$/,
				/^http:\/\/dbpedia.org\/class\/yago\/OccupationalGroup\d+$/
			]
		},
		prop: 'type',
		value: 'group'
	}],
	// for place:
	'http://www.w3.org/2003/01/geo/wgs84_pos#lat': [{
		match: {
			type: 'literal'
		},
		prop: 'latitude',
		parser: parseFloat
	}],
	'http://www.w3.org/2003/01/geo/wgs84_pos#long': [{
		match: {
			type: 'literal'
		},
		prop: 'longitude',
		parser: parseFloat
	}],
	'http://dbpedia.org/property/website': [{
		match: {
			type: 'uri'
		},
		prop: 'homepage'
	}],
	'http://xmlns.com/foaf/0.1/homepage': [{
		match: {
			type: 'uri'
		},
		prop: 'homepage'
	}],
	'http://dbpedia.org/ontology/foundingDate': [{
		match: {
			type: 'literal',
			datatype: 'http://www.w3.org/2001/XMLSchema#date'
		},
		prop: 'foundingDate'
	}],
	'http://dbpedia.org/property/currencyCode': [{
		match: {
			type: 'literal'
		},
		prop: 'currencyCode'
	}],
	// for person:
	'http://xmlns.com/foaf/0.1/givenName': [{
		match: {
			type: 'literal'
		},
		prop: 'givenName'
	}],
	'http://xmlns.com/foaf/0.1/surname': [{
		match: {
			type: 'literal'
		},
		prop: 'surname'
	}],
	'http://dbpedia.org/ontology/birthYear': [{
		match: {
			type: 'literal',
			datatype: 'http://www.w3.org/2001/XMLSchema#gYear'
		},
		prop: 'birthYear',
		parser: parseInt
	}],
	'http://dbpedia.org/property/dateOfBirth': [{
		match: {
			type: 'literal',
			datatype: 'http://www.w3.org/2001/XMLSchema#date'
		},
		prop: 'birthDate'
	}],
	'http://dbpedia.org/ontology/birthDate': [{
		match: {
			type: 'literal',
			datatype: 'http://www.w3.org/2001/XMLSchema#date'
		},
		prop: 'birthDate'
	}],
	'http://dbpedia.org/ontology/deathDate': [{
		match: {
			type: 'literal',
			datatype: 'http://www.w3.org/2001/XMLSchema#date'
		},
		prop: 'deathDate'
	}],
	'http://dbpedia.org/ontology/deathYear': [{
		match: {
			type: 'literal',
			datatype: 'http://www.w3.org/2001/XMLSchema#gYear'
		},
		prop: 'deathYear',
		parser: parseInt
	}],
	'http://xmlns.com/foaf/0.1/depiction': [{
		match: {
			type: 'uri'
		},
		prop: 'depiction'
	}],
	'http://dbpedia.org/property/shortDescription': [{
		match: {
			type: 'literal'
		},
		prop: 'title'
	}],
	'http://dbpedia.org/property/title': [{
		match: {
			type: 'literal'
		},
		prop: 'title'
	}],
	'http://dbpedia.org/ontology/birthPlace': [{
		match: {
			type: 'uri'
		},
		prop: 'birthPlace',
		parser: resourceNameParser
	}],
	'http://dbpedia.org/property/placeOfBirth': [{
		match: {
			type: 'uri'
		},
		prop: 'birthPlace',
		parser: resourceNameParser
	}],
	'http://dbpedia.org/ontology/deathPlace': [{
		match: {
			type: 'uri'
		},
		prop: 'deathPlace',
		parser: resourceNameParser
	}],
	'http://dbpedia.org/property/placeOfDeath': [{
		match: {
			type: 'uri'
		},
		prop: 'deathPlace',
		parser: resourceNameParser
	}],
	// for group:
	'http://dbpedia.org/property/symbol': [{
		match: {
			type: 'literal'
		},
		prop: 'symbol'
	}],
	'http://dbpedia.org/ontology/locationCity': [{
		match: {
			type: 'uri'
		},
		prop: 'locationCity',
		parser: resourceNameParser
	}],
	'http://dbpedia.org/ontology/foundationPlace': [{
		match: {
			type: 'uri'
		},
		prop: 'locationCity',
		parser: resourceNameParser
	}],
	'http://dbpedia.org/property/foundation': [{
		match: {
			type: 'uri'
		},
		prop: 'locationCity',
		parser: resourceNameParser
	}]
};

function testMatch(item, match) {
	for (var prop in match) {
		var values = match[prop];
		if (!Array.isArray(values)) {
			values = [values];
		}
		var found = false;
		for (var i = 0; i < values.length; i++) {
			var value = values[i];
			if (_.isString(value) || _.isNumber(value)) {
				if (value === item[prop]) {
					found = true;
				}
			} else {
				if (value.test(item[prop])) {
					found = true;
				}
			}
		}
		if (!found) {
			return false;
		}
	}
	return true;
}

module.exports = function(title) {
	title = title.replace(/ /g, '_');
	var url = 'http://dbpedia.org/data/' + encodeURIComponent(title) + '.json';
	// console.log(url);
	return request({
			url: url,
			timeout: 8 * 1000,
			json: true
		})
		.then(function(body) {
			body = body || {};
			var details = {};
			var resourceProp = 'http://dbpedia.org/resource/' + encodeURIComponent(title);
			var resource = body[resourceProp] || {};
			// console.log(body);
			for (var elementName in DETAILS) {
				// console.log('elementName', elementName);
				var resouceElement = resource[elementName];
				// console.log('resouceElement', resouceElement);
				if (resouceElement) {
					// console.log('resouceElement', resouceElement);
					var detailsItems = DETAILS[elementName];
					// console.log('detailsItems', detailsItems);
					for (var i = 0; i < detailsItems.length; i++) {
						var detailsItem = detailsItems[i];
						// console.log('detailsItem', detailsItem);
						if (!details[detailsItem.prop]) {
							for (var k = 0; k < resouceElement.length; k++) {
								var resouceItem = resouceElement[k];
								// console.log('resouceItem', resouceItem);
								if (testMatch(resouceItem, detailsItem.match)) {
									details[detailsItem.prop] = detailsItem.value || resouceItem.value;
									if (detailsItem.parser) {
										details[detailsItem.prop] = detailsItem.parser(details[detailsItem.prop]);
									}
									break;
								}
							}
						}
					}
				}
			}


			return details;
		});
};

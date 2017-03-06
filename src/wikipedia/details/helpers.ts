'use strict';

const parseFloatFixed = (digits) => {
	return (value) => {
		return parseFloat(parseFloat(value).toFixed(digits));
	};
};

export type EntityDetailsType = {
	types?: string[],
	props?: object
};

export function parseResource(value) {
	const result = /^http:\/\/dbpedia\.org\/resource\/([^\/]+)$/.exec(value);
	if (result) {
		return decodeURIComponent(result[1].replace(/_/g, ' '));
	}
	return value;
};

export const NAMESPACES = {
	// http://schema.org/
	schema: /^http:\/\/schema\.org\/([^\/]+)$/,
	// http://dbpedia.org/ontology/
	dbo: /^http:\/\/dbpedia\.org\/ontology\/([^\/]+)$/,
	// http://dbpedia.org/property/
	dbp: /^http:\/\/dbpedia\.org\/property\/([^\/]+)$/,
	// http://xmlns.com/foaf/0.1/homepage
	foaf: /^http:\/\/xmlns\.com\/foaf\/0\.1\/([^\/]+)$/,
	// http://www.wikidata.org/entity/Q215627
	wikidata: /^http:\/\/www\.wikidata\.org\/entity\/([^\/]+)$/
};

export const DATA_TYPES = ['schema', 'dbo', 'wikidata'];

export const DATA_PROPS: { key: string, name: string, type?: string, value?: any }[] = [
	//
	// COMMON
	//
	{
		key: 'http://xmlns.com/foaf/0.1/homepage',
		name: 'website'
	}, {
		key: 'http://dbpedia.org/property/website',
		name: 'website'
	},
	// {
	//  key: 'http://dbpedia.org/ontology/wikiPageID',
	//  name: 'wikiPageID',
	//  value: parseInt
	// },
	//
	// PLACE
	//
	{
		key: 'http://www.w3.org/2003/01/geo/wgs84_pos#lat',
		name: 'lat',
		value: parseFloatFixed(4)
	}, {
		key: 'http://www.w3.org/2003/01/geo/wgs84_pos#long',
		name: 'long',
		value: parseFloatFixed(4)
	}, {
		key: 'http://dbpedia.org/ontology/postalCode',
		name: 'postalCode'
	}, {
		key: 'http://dbpedia.org/property/area',
		name: 'area',
		value: parseFloatFixed(2)
	}, {
		key: 'http://dbpedia.org/ontology/country',
		name: 'country'
	}, {
		key: 'http://dbpedia.org/ontology/areaCode',
		name: 'areaCode'
	}, {
		key: 'http://dbpedia.org/ontology/elevation',
		name: 'elevation'
	}, {
		key: 'http://dbpedia.org/ontology/demonym',
		name: 'demonym'
	}, {
		key: 'http://dbpedia.org/property/populationDemonym',
		name: 'demonym'
	}, {
		key: 'http://dbpedia.org/property/population',
		name: 'population',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/ontology/populationTotal',
		name: 'population',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/property/currencyCode',
		name: 'currencyCode'
	}, {
		key: 'http://dbpedia.org/ontology/currency',
		name: 'currency'
	}, {
		key: 'http://dbpedia.org/ontology/capital',
		name: 'capital'
	}, {
		key: 'http://dbpedia.org/property/capital',
		name: 'capital'
	}, {
		key: 'http://dbpedia.org/ontology/capital',
		name: 'capital'
	}, {
		key: 'http://dbpedia.org/property/nativeName',
		name: 'nativeName'
	}, {
		key: 'http://dbpedia.org/property/nativeName',
		name: 'nativeName'
	},

	//
	// PERSON
	//
	{
		key: 'http://dbpedia.org/property/religion',
		name: 'religion'
	}, {
		key: 'http://dbpedia.org/ontology/religion',
		name: 'religion'
	}, {
		key: 'http://dbpedia.org/ontology/birthPlace',
		name: 'birthPlace',
		type: 'array'
	}, {
		key: 'http://dbpedia.org/property/birthPlace',
		name: 'birthPlace',
		type: 'array'
	}, {
		key: 'http://dbpedia.org/ontology/deathPlace',
		name: 'deathPlace',
		type: 'array'
	}, {
		key: 'http://dbpedia.org/property/deathPlace',
		name: 'deathPlace',
		type: 'array'
	}, {
		key: 'http://dbpedia.org/property/birthDate',
		name: 'birthDate'
	}, {
		key: 'http://dbpedia.org/ontology/birthDate',
		name: 'birthDate'
	}, {
		key: 'http://dbpedia.org/property/deathDate',
		name: 'deathDate'
	}, {
		key: 'http://dbpedia.org/ontology/deathDate',
		name: 'deathDate'
	}, {
		key: 'http://dbpedia.org/property/deathYear',
		name: 'deathYear',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/ontology/deathYear',
		name: 'deathYear',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/property/birthYear',
		name: 'birthYear',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/ontology/birthYear',
		name: 'birthYear',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/ontology/spouse',
		name: 'spouse'
	}, {
		key: 'http://dbpedia.org/ontology/region',
		name: 'region'
	}, {
		key: 'http://dbpedia.org/ontology/award',
		name: 'award'
	}, {
		key: 'http://xmlns.com/foaf/0.1/givenName',
		name: 'givenName'
	}, {
		key: 'http://xmlns.com/foaf/0.1/surname',
		name: 'familyName'
	}, {
		key: 'http://schema.org/givenName',
		name: 'givenName'
	}, {
		key: 'http://schema.org/familyName',
		name: 'familyName'
	}, {
		key: 'http://schema.org/gender',
		name: 'gender'
	},
	//
	// ORG
	//
	{
		key: 'http://dbpedia.org/ontology/foundingDate',
		name: 'foundingDate'
	}, {
		key: 'http://dbpedia.org/ontology/location',
		name: 'location'
	}, {
		key: 'http://dbpedia.org/ontology/locationCity',
		name: 'location'
	}, {
		key: 'http://dbpedia.org/property/symbol',
		name: 'symbol'
	}, {
		key: 'http://dbpedia.org/ontology/numberOfEmployees',
		name: 'employees',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/property/numEmployees',
		name: 'employees',
		value: parseInt
	}, {
		key: 'http://dbpedia.org/ontology/currentStatus',
		name: 'status'
	}, {
		key: 'http://dbpedia.org/property/currentStatus',
		name: 'status'
	}, {
		key: 'http://dbpedia.org/ontology/industry',
		name: 'industry'
	}

];

'use strict';

const request = require('request');
import { _, Promise } from '../../utils';
import * as helpers from './helpers';
const N3 = require('n3');
const parser = new N3.Parser();
const N3Util = N3.Util;

const DATA_TYPES = helpers.DATA_TYPES;
const DATA_PROPS = helpers.DATA_PROPS.reduce((d, c) => {
	d[c.key] = c;
	return d;
}, {});
const NAMESPACES = helpers.NAMESPACES;
const parseResource = helpers.parseResource;

function setProp(props, data) {
	const info = DATA_PROPS[data.predicate];

	if (!info || props[info.name] !== undefined) {
		return;
	}

	let value = data.object;

	if (N3Util.isLiteral(value)) {
		value = N3Util.getLiteralValue(value);
	}

	if (info.value) {
		value = info.value(value);
	} else {
		value = parseResource(value);
	}

	props[info.name] = value;
}

function getDetailItem(details, item) {
	const typePredicate = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

	if (typePredicate === item.predicate) {
		for (let i = DATA_TYPES.length - 1; i >= 0; i--) {
			let schema = DATA_TYPES[i];
			const result = NAMESPACES[schema].exec(item.object);
			if (result) {
				details.types.push(schema + ':' + result[1]);
				break;
			}
		}
	} else {
		setProp(details.props, item);
	}
}

export function parse(title, options): Promise<helpers.EntityDetailsType> {
	title = title.replace(/ /g, '_');

	const subject = 'http://dbpedia.org/resource/' + title;
	const url = 'http://dbpedia.org/data/' + encodeURI(title) + '.ntriples';

	options = _.defaults({ url: url, json: false }, options || {}, { timeout: 8 * 1000 });

	return new Promise((resolve, reject) => {
		const details = { types: [], props: {} };
		parser.parse(request(options), (error, triple) => {
			if (error) {
				return reject(error);
			}
			if (triple) {
				if (triple.subject === subject) {
					getDetailItem(details, triple);
				}
			} else {
				resolve(details);
			}
		});
	});
};

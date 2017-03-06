'use strict';

import request from '../../request';
import { _, Promise } from '../../utils';
import * as helpers from './helpers';

const DATA_TYPES = helpers.DATA_TYPES;
const DATA_PROPS = helpers.DATA_PROPS;
const NAMESPACES = helpers.NAMESPACES;
const parseResource = helpers.parseResource;

function getTypes(data): string[] {
	data = data['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] || [];
	const types: string[] = [];
	let result;
	data.forEach((item) => {
		for (let i = DATA_TYPES.length - 1; i >= 0; i--) {
			let schema = DATA_TYPES[i];
			result = NAMESPACES[schema].exec(item.value);
			if (result) {
				types.push(schema + ':' + result[1]);
				break;
			}
		}
	});

	return types;
	// return types.filter((v, i, a) => a.indexOf(v) === i);
}

function getProps(data) {
	const props: any = {};

	function getPropItem(item, info) {
		let value = item.value;
		if (info.value) {
			value = info.value(value);
		} else {
			value = parseResource(value);
		}

		return value;
	}

	DATA_PROPS.forEach((info) => {
		if (!props[info.name]) {
			let items = data[info.key];
			if (items && items.length > 0) {
				let value;
				if (info.type === 'array') {
					value = items.map((item) => {
						return getPropItem(item, info);
					}).join('|');
				} else {
					value = getPropItem(items[0], info);
				}
				props[info.name] = value;
			}
		}
	});

	return props;
}

function getDetails(data, title): helpers.EntityDetailsType {
	const resourceProp = 'http://dbpedia.org/resource/' + encodeURI(title);
	const resource = data[resourceProp];
	if (!resource) {
		return null;
	}

	const details: helpers.EntityDetailsType = {};

	details.types = getTypes(resource);
	details.props = getProps(resource);

	return details;
}

export function parse(title, options): Promise<helpers.EntityDetailsType> {
	title = title.replace(/ /g, '_');
	const url = 'http://dbpedia.org/data/' + encodeURI(title) + '.json';
	options = _.defaults({
		url: url,
		json: true
	}, options || {}, { timeout: 8 * 1000 });

	return request(options)
		.then((body) => {
			body = body || {};
			return getDetails(body, title);
		});
};

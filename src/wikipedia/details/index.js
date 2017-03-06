'use strict';

function getType(types) {
	const data = {
		person: ['dbo:Person', 'schema:Person'],
		group: ['dbo:Company', 'schema:Organization', 'dbo:Organisation'],
		place: ['dbo:Place', 'schema:Place', 'dbo:Location']
	};

	for (let type in data) {
		for (let i = 0; i < data[type].length; i++) {
			if (~types.indexOf(data[type][i])) {
				return type;
			}
		}
	}

	return null;
}

module.exports = (title, options, parserName) => {
	let parser;
	if (parserName === 'json') {
		parser = require('./json_parser');
	} else {
		parser = require('./n3_parser');
	}
	return parser(title, options)
		.then((details) => {
			if (details) {
				if (details.types) {
					if (details.types.length === 0) {
						details.types = null;
					} else {
						details.type = getType(details.types);
					}
				}
			}

			return details;
		});
};

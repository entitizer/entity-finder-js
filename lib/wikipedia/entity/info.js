'use strict';

var core = require('entipic.core');
var api = require('../api.js');
var utils = require('../../utils.js');
var parser = require('../parser.js');
var internal = {};

module.exports = function(lang, title, first) {
	return internal.info(lang, title, first);
};

internal.info = function(lang, title, first) {
	var isOneWord = utils.isOneWord(title);
	first = core.util.isNull(first) ? true : first;

	function getInfo() {
		if (isOneWord) {
			var list;
			var uTitle = title.toUpperCase();
			return internal.search(lang, title)
				.then(function(results) {
					list = results;
					return internal.findInfoLength(list, title);
				})
				.then(function(info) {
					if (!info && title !== uTitle) {
						return internal.searchLength(lang, uTitle, first);
					}
				})
				.then(function(info) {
					if (!info && list && list.length > 0 && first) {
						info = list[0];
						// example: `chi` != `Chiha`
						if (!utils.isOneWord(info.title)) {
							return info;
						}
					}
					return info;
				});
		}
		return internal.search(lang, title).then(internal.first);
	}

	return getInfo().then(internal.validateInfo);
};

internal.first = function(list) {
	if (list && list.length > 0) {
		return list[0];
	}
	return null;
};

internal.validateInfo = function(info) {
	if (!info) {
		return info;
	}
	if (!info.description || core.text.endsWith(info.description, ':')) {
		delete info.description;
	}
	return info;
};

internal.findInfoLength = function(list, title, first) {
	for (var i = 0; i < list.length; i++) {
		if (list[i].title.length === title.length) {
			return list[i];
		}
	}
	if (first && list.length > 0) {
		return list[0];
	}
};

internal.searchLength = function(lang, title, first) {
	return internal.search(lang, title).then(function(list) {
		return internal.findInfoLength(list, title, first);
	});
};

internal.search = function(lang, title) {
	return api.openSearch(lang, title).then(parser.parseWikiOpenSearch);
};

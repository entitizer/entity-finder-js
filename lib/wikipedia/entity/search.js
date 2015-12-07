'use strict';

var api = require('../api.js');
var parser = require('../parser.js');
var internal = {};

module.exports = function(lang, title) {
	return internal.search(lang, title);
};

internal.search = function(lang, title) {
	return api.search(lang, title).then(parser.parseWikiQuerySearch)
		.then(function(results) {
			return internal.identify(lang, title, results);
		});
};

internal.identify = function(lang, title, results) {
	if (!results || results.length === 0) {
		return null;
	}

	function simple(text) {
		return text.replace(/[,;_+=|\/\\#@!%^&\(\)\[\]{}$'":\.?<>-]+/gi, ' ').replace(/ {2,}/, ' ').trim();
	}

	function words(text) {
		return simple(text).split(' ');
	}

	title = title.toLowerCase();
	var simpleTitle = simple(title);
	var wordsTitle = words(title);
	var result;
	var resultTitle;

	for (var i = 0; i < 3 && i < results.length; i++) {
		result = results[i];
		resultTitle = result.title.toLowerCase();
		if (resultTitle === title || simpleTitle === simple(resultTitle) || wordsTitle.length === words(resultTitle).length) {
			return result;
		}
	}
};

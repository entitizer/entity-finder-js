'use strict';

var utils = require('./utils');
var wikiData = require('wikipedia-data');
var wiki = require('./wikipedia');

function getDisambiguationNames(lang) {
	return wikiData.getDisambiguationNames2()[lang];
}

function findTitles(name, lang, limit) {
	var wordsCount = utils.countWords(name);
	return wiki.api.openSearch(lang, name)
		.then(function(result) {
			var names = [];
			for (var i = 0; i < limit && i < result[1].length; i++) {
				name = {
					title: result[1][i],
					description: result[2][i]
				};
				var title = utils.formatTitle(name.title);
				if (title.simpleTitle) {
					// if (utils.countWords(title.simpleTitle) !== wordsCount) {
					// 	continue;
					// }
					var disName = getDisambiguationNames(lang);
					if (disName === title.specialTitle || disName.toLowerCase() === title.specialTitle) {
						continue;
					}
					name.simpleTitle = title.simpleTitle;
					name.specialTitle = title.specialTitle;
				} else {
					if (utils.countWords(name.title) !== wordsCount) {
						continue;
					}
				}
				names.push(name);
			}
			return names;
		});
}

exports.findTitles = function(name, lang, limit) {
	name = name.split('|')[0];

	return findTitles(name, lang, limit);
};

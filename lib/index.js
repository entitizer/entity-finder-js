'use strict';

var utils = require('./utils');
var _ = utils._;
var Promise = utils.Promise;
var wiki = require('./wikipedia');
var finder = require('./finder');

var OPTIONS = {
	limit: 2,
	props: {
		details: true
	}
};

function wikiPages(name, lang) {
	if (!_.isString(name)) {
		return Promise.resolve(name);
	}
	return wiki.pagesByTitles(name, lang)
		.then(function(pages) {
			return pages.filter(function(page) {
				return !page.isDisambiguation;
			});
		});
}

function wikiPageDetails(page) {
	var entitle = _.find(page.langlinks, {
		lang: 'en'
	});
	if (entitle) {
		return wiki.pageDetails(entitle.title);
	}
}

function formatEntity(page, details) {
	var entity = {
		name: page.title,
		wikiId: page.pageid,
		wikiPage: page,
		lang: page.pagelanguage
	};
	if (page.simpleTitle) {
		entity.simpleName = page.simpleTitle;
		entity.specialName = page.specialTitle;
	}
	if (details) {
		entity.details = details;
		if (details.type) {
			entity.type = details.type;
		}
	}

	return entity;
}

function getWikiPageDetails(page, options) {
	if (options.props.details) {
		return wikiPageDetails(page);
	}
}

function getEntities(name, lang, options) {
	options = _.defaultsDeep(options || {}, OPTIONS);

	return wikiPages(name, lang)
		.then(function(pages) {
			pages = _.take(pages || [], options.limit);
			return Promise.mapSeries(pages, function(page) {
				return Promise.props({
						details: getWikiPageDetails(page, options)
					})
					.then(function(props) {
						return formatEntity(page, props.details);
					});
			});
		});
}

exports.find = function(name, lang, options) {
	options = _.defaultsDeep(options || {}, OPTIONS);

	// console.log('find', name);

	return finder.findTitles(name, lang, options.limit + 2)
		.then(function(titles) {
			if (titles.length === 0) {
				return titles;
			}
			name = _.pluck(titles, 'title').join('|');

			// console.log('find entities', name);

			return getEntities(name, lang, options);
		});
};

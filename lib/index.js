'use strict';

var utils = require('./utils');
var _ = utils._;
var Promise = utils.Promise;
var wiki = require('./wikipedia');
var finder = require('./finder');

var OPTIONS = {
	limit: 2,
	details: true,
	filterDis: true,
	filterDisDeep: false
};

function wikiPages(name, lang, filterDis) {
	return wiki.pagesByTitles(name, lang)
		.then(function(pages) {
			if (filterDis) {
				return pages.filter(function(page) {
					return !page.isDisambiguation;
				});
			}
			return pages;
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
	if (page.extract) {
		entity.description = page.extract;
	}

	if (details) {
		entity.details = details;
		if (details.type) {
			entity.type = details.type;
		}
	}

	if (page.redirects) {
		entity.names = [];
		page.redirects.forEach(function(item) {
			entity.names.push(item.title);
		});
	}

	if (entity.lang !== 'en' && page.langlinks) {
		var en = _.find(page.langlinks, {
			lang: 'en'
		});
		if (en) {
			entity.englishName = en.title;
		}
	}

	return entity;
}

function getWikiPageDetails(page, options) {
	if (options.details) {
		return wikiPageDetails(page);
	}
}

function passFilterByDis(page, options) {
	if (options.filterDisDeep && page.categories && page.categories.length > 0) {
		var title = _.take(_.pluck(page.categories, 'title'), 5).join('|');
		return wiki.pageQuery(page.pagelanguage, 'titles', title, {
			prop: 'info|categories|templates',
			tllimit: 'max'
		}).then(function(pages) {
			return !_.any(pages, {
				format: 'disambiguation'
			});
		});
	}
	return true;
}

function getEntities(name, lang, options) {
	options = _.defaults(options || {}, OPTIONS);

	return wikiPages(name, lang, options.filterDis)
		.then(function(pages) {
			pages = _.take(pages || [], options.limit);
			return Promise.mapSeries(pages, function(page) {
					return Promise.props({
							details: getWikiPageDetails(page, options),
							passDis: passFilterByDis(page, options)
						})
						.then(function(props) {
							if (props.passDis) {
								return formatEntity(page, props.details);
							} else {
								// console.log('no pass filter:', page.title)
							}
						});
				})
				.filter(function(entity) {
					return !!entity;
				});
		});
}

exports.getWikiPage = function(title, lang, options) {
	options = options || {};
	return wiki.pagesByTitles(title, lang)
		.then(function(pages) {
			if (pages && pages.length > 0) {
				var page = pages[0];
				return getWikiPageDetails(page, options)
					.then(function(details) {
						if (details) {
							page.details = details;
						}
						return page;
					});
			}
		});
};

exports.find = function(name, lang, options) {
	options = _.defaults(options || {}, OPTIONS);

	// console.log('find', name);

	return finder.findTitles(name, lang, options.limit + 1)
		.then(function(titles) {
			if (titles.length === 0) {
				titles = titles[name];
				// return titles;
			}
			name = _.pluck(titles, 'title').join('|');

			// console.log('find entities', name);

			return getEntities(name, lang, options)
				.then(function(entities) {
					entities.forEach(function(entity) {
						if (!entity.description) {
							var title = _.find(titles, {
								title: entity.name
							});
							if (title) {
								entity.description = title.description;
							}
						}
					});
					return entities;
				});
		});
};

'use strict';

const debug = require('debug')('entity-finder');

const utils = require('./utils');
const _ = utils._;
const Promise = utils.Promise;
const wiki = require('./wikipedia');
const finder = require('./finder');

const OPTIONS = {
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
	const entitle = _.find(page.langlinks, {
		lang: 'en'
	});
	if (entitle) {
		return wiki.pageDetails(entitle.title);
	}
}

function formatEntity(page, details) {
	const entity = {
		name: page.title,
		wikiId: page.pageid,
		wikiPage: page,
		lang: page.pagelanguage
	};
	if (page.extract) {
		entity.description = page.extract;
	}

	if (details) {
		if (details.type) {
			entity.type = details.type;
		}
		if (details.types) {
			entity.types = details.types;
		}
		if (details.props) {
			entity.props = details.props;
		}
	}

	if (page.redirects) {
		entity.names = [];
		page.redirects.forEach(function(item) {
			entity.names.push(item.title);
		});
	}

	if (entity.lang !== 'en' && page.langlinks) {
		const en = _.find(page.langlinks, {
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
		const title = _.take(_.pluck(page.categories, 'title'), 5).join('|');
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
								debug(page.title + ': didn`t pass filter');
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
				const page = pages[0];
				return getWikiPageDetails(page, options)
					.then(function(details) {
						if (details) {
							if (details.type) {
								page.type = details.type;
							}
							if (details.types) {
								page.types = details.types;
							}
							if (details.props) {
								page.props = details.props;
							}
						}
						return page;
					});
			}
		});
};

exports.find = function(name, lang, options) {
	options = _.defaults(options || {}, OPTIONS);

	debug('options', options);
	debug('finding name:', name);

	// console.log('find', name);

	return finder.findTitles(name, lang, options.limit + 1)
		.then(function(titles) {
			if (titles.length === 0) {
				titles = titles[name];
				// return titles;
			}
			name = _.pluck(titles, 'title').join('|');

			debug('finding titles:', name);

			return getEntities(name, lang, options)
				.then(function(entities) {
					entities.forEach(function(entity) {
						if (!entity.description) {
							const title = _.find(titles, {
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

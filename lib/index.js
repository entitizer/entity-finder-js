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
	filterDisDeep: false,
	tags: null
};

function wikiPages(name, lang, options) {
	return wiki.pagesByTitles(name, lang)
		.filter(page => {
			return page.pageid && page.pageid > 0;
		})
		.then(function(pages) {
			if (options.filterDis) {
				return pages.filter(function(page) {
					return !page.isDisambiguation;
				});
			}
			return pages;
		})
		.then(function(pages) {
			if (pages && pages.length > 1 && options.tags) {
				const titles = name.split('|');
				return _.sortBy(pages, (page) => {
					const index = titles.indexOf(page.title);
					return index > -1 ? index : 1000;
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
		if (details.props && Object.keys(details.props).length > 0) {
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
	const entities = [];
	return wikiPages(name, lang, options)
		.mapSeries(page => {
			if (entities.length === options.limit) {
				return null;
			}
			return Promise.props({
					details: getWikiPageDetails(page, options),
					passDis: passFilterByDis(page, options)
				})
				.then(props => {
					if (props.passDis) {
						entities.push(formatEntity(page, props.details));
					} else {
						debug(page.title + ': didn`t pass filter');
					}
				});
		})
		.then(function() {
			return entities;
		});
}

exports.find = function(name, lang, options) {
	options = _.defaults(options || {}, OPTIONS);

	debug('options', options);
	debug('finding name:', name);

	if (typeof options.tags === 'string') {
		options.tags = [options.tags];
	}

	if (options.tags) {
		options.tags = options.tags.map((tag) => {
			return new RegExp('(^|\\b)' + tag + '(\\b|$)', 'gi');
		});
	}

	// console.log('find', name);

	return finder.findTitles(name, lang, options.limit + 1, options.tags)
		.then(function(titles) {
			if (titles.length === 0) {
				titles = [{ title: name }];
				// return [];
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

exports.findTitles = finder.findTitles;

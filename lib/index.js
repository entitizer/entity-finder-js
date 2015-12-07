'use strict';

var utils = require('./utils');
var _ = utils._;
var Promise = utils.Promise;
var wiki = require('./wikipedia');

var OPTIONS = {
	limit: 2,
	props: {
		type: true
	}
};

var getEntities = exports.getEntities = function(name, lang, options) {
	options = _.defaultsDeep(options || {}, OPTIONS);

	return wiki.pagesByTitles(lang, name)
		.then(function(pages) {
			pages = _.take(pages, options.limit);

			if (options.props.type) {
				return Promise.each(pages, function(page) {
					var entitle = _.find(page.langlinks, {
						lang: 'en'
					});
					if (entitle) {
						entitle = entitle.title;
						return wiki.pageType(entitle).then(function(type) {
							page.type = type;
							return page;
						});
					}
					return page;
				});
			}
			return pages;
		});
};

exports.find = function(name, lang, options) {
	return getEntities(name, lang, options);
};

'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

function formatTitle(title) {
	var result = /\(([^)]+)\)$/i.exec(title);
	var page = {
		title: title
	};
	if (result) {
		page.simpleTitle = page.title.substr(0, result.index).trimRight();
		page.specialTitle = result[1];
	}

	return page;
}

function countWords(title) {
	return title.split(/[\s-]+/g).length;
}

exports.countWords = countWords;
exports.formatTitle = formatTitle;
exports.Promise = Promise;
exports._ = _;

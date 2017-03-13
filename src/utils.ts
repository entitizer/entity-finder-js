
export const _ = require('lodash');
import * as BluebirdPromise from 'bluebird';
import {PageTitleType} from './types';

export const Promise = BluebirdPromise;

export function formatTitle(title: string): PageTitleType {
	var result = /\(([^)]+)\)$/i.exec(title);
	const pageTitle: PageTitleType = {
		title: title
	};
	if (result) {
		pageTitle.simple = pageTitle.title.substr(0, result.index).trim();
		pageTitle.special = result[1];
	}

	return pageTitle;
}

export function countWords(title: string): number {
	return title.split(/[\s-]+/g).length;
}

export function isWikidataId(id: string) {
	return /^Q\d+$/.test(id);
}

export const _ = require('lodash');
import * as BluebirdPromise from 'bluebird';

export const Promise = BluebirdPromise;

export type PageTitleType = {
	title: string,
	simple?: string,
	special?: string,
	description?: string,
	isDisambiguation?: boolean
};

export type PageType = {
	title: string,
	pageid?: number,
	simpleTitle?: string,
	specialTitle?: string,
	extract?: string,
	simple?: string,
	special?: string,
	pagelanguage?: string,
	isDisambiguation?: boolean,
	categories?: { title: string }[],
	format?: string,
	templates?: { title: string }[],
	type?: string
};

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

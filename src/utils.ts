
export const _ = require('lodash');
import * as BluebirdPromise from 'bluebird';

export const Promise = BluebirdPromise;

export function countWords(title: string): number {
	return title.split(/[\s-]+/g).length;
}

export function isWikidataId(id: string) {
	return /^Q\d+$/.test(id);
}
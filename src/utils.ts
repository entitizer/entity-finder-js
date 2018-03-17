
export function countWords(title: string): number {
	return title.split(/[\s-]+/g).length;
}

export function isWikidataId(id: string) {
	return /^Q\d+$/.test(id);
}

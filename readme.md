# entity-finder

A nodejs entity finder. **entity-finder** that searchs the wikipedia for titles and returns the most correct answers.

It will omit any wikipedia disambiguization pages.

## Usage

```js
import { find } from 'entity-finder';

const name = 'democratic party thailand';
const lang = 'en';
const titles = await findTitles(name, lang, { limit: 1, tags: 'thailand' });
const title = titles[0]:
// title =
// { 
//   title: 'Democrat Party (Thailand)',
//   simple: 'Democrat Party',
//   special: 'Thailand',
//   description: 'The Democrat Party (Thai: พรรคประชาธิปัตย์; RTGS: prachathipat) is a Thai political party...',
// }

```

## API

### find(name: string, lang: string, options?): Promise<PageTitle[]>

Finds entities. Returns an array of entities ordered by relevance.

- **name** (String), required - Entity name: `Italy`. Maybe any text: `David the sculpture`.
- **lang** (String), required - Language 2 chars code: `en`.
- **options** (Object), optional - Options object:
  - **limit** (Number) - Maxim number of entities to return. Default: 2.

#### PageTitle

```ts
export type PageTitle = {
  title: string
  simple?: string
  special?: string
  description?: string
  about?: string
  categories?: string[]
}
```

## Changelog

### v0.7.0 - Jan 16, 2025

- expose only `find` function

### v0.6.0 - May 31, 2021

- remove `wiki-entity` dependency.
- remove `request` dependency.
- sixes

### v0.5.1 - Match 21, 2018

- New option: `orderByTagsLimit` - Limits titles ordered by tags.

### v0.5.0 - Match 17, 2018

- search only for titles
- updated API
- filters dezambiguization titles (Category:Dezambiguization)
- updated `options` param

### v0.4.0 - Match 18, 2017

- using module [wiki-entity](https://github.com/entitizer/wiki-entity-js)
- new results: returns an array of [WikiEntity](https://github.com/entitizer/wiki-entity-js#wikientity)
- updated `options` param

### v0.3.0 - March 6, 2017

- TypeScript code
- **changed entity type**: `group` to `org`

### v0.2.0 - November 4, 2016

- node4;
- new wikipedia parser: n3 - better performance;
- added option: `tags`;
- news model fields: `types` and `props`;

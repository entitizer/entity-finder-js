# entity-finder

A nodejs Named entity finder. **entity-finder** will search the internet(wikipedia, ...) for an entity and return the most correct answers.

## API

### find(name, lang, options)

Finds entities. Returns an array of entities ordered by relevance.

- **name** (String), required - Entity name: `Italy`.
- **lang** (String), required - Language 2 chars code: `en`.
- **options** (Object), optional - Options object:
  - **limit** (Number) - Maxim number of entities to return. Default: 2.
  - **details** (Boolean) - Entity details. Default: `true`.
  - **filterDis** (Boolean) - Filter disambiguations. Default: `true`.
  - **filterDisDeep** (Boolean) - Filter disambiguation pages by testing parent categories. Default: `false`. Useful for filtering `hndis`, etc.
  - **tags** ([String]) (null) - Order results by tags score.

### Entity object:

- **name** (String) - Entity name;
- **type** (String) - Entity type: `place`, `person`, `org`;
- **wikiId** (Number) - Wikipedia page id;
- **lang** (String) - Language code.
- **wikiPage** (Object) - Wikipedia page info:
  - **title** (String) - Wikipedia page title;
  - **pageid** (Number) - Wikipedia page id;
  - **langlinks** (Object[]) - Wikipedia langlinks;
  - **redirects** (Object[]) - Wikipedia redirects;
  - **categories** (Object[]) - Wikipedia categories;
  - **simpleTitle** (String) - Entity simple title;
  - **specialTitle** (String) - Entity special title;
- **names** (String[]) - An array of alt names;
- **types** (String[]) - A list of object types: dbo:Person, schema:Person, etc.
- **props** (Object) - Some extra properties


## Algorithm

1. Find wikipedia names: dezambiguizations, ...
2. For found names get wikipedia pages;
3. Filter pages;
4. For every wikipedia page find details;


## Changelog

### v0.3.0 - March 6, 2017

- TypeScript code
- **changed entity type**: `group` to `org`

### v0.2.0 - November 4, 2016

- node4;
- new wikipedia parser: n3 - better performance;
- added option: `tags`;
- news model fields: `types` and `props`;

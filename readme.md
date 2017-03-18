# entity-finder

A nodejs Named entity finder. **entity-finder** will search the internet(wikipedia, ...) for an entity and return the most correct answers.

## API

### find(name, lang, options)

Finds entities. Returns an array of entities ordered by relevance.

- **name** (String), required - Entity name: `Italy`.
- **lang** (String), required - Language 2 chars code: `en`.
- **options** (Object), optional - Options object:
  - **limit** (Number) - Maxim number of entities to return. Default: 2.
  - **claims** (String) - How to resolve the claims. Can be: `none`, `all`, `item`, `property`. Default: `none`. `all` resolves `item` and `property` types.
  - **extract** (Number) - Sentences in the extract. Default: `0`.
  - **tags** ([String]) (null) - Order results by tags score.




## Changelog

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

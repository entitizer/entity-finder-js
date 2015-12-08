# entity-finder

A nodejs Named entity finder. **entity-finder** will search the internet(wikipedia, ...) for an entity and return the most correct answers.


## API

### find(name, lang, options)

Finds entities. Returns an array of entities ordered by relevance.

- **name** (String), required - Entity name: `Italy`.
- **lang** (String), required - Language 2 chars code: `en`.
- **options** (Object), optional - Options object:
  - **country** (String) - Country 2 chars code: `us`. Entity regional context. Very useful when we have many people(entities) with same name in different countries.
  - **limit** (Number) - Maxim number of entities to return. Default: 2.
  - **details** (Boolean) - Entity details. Default: `true`.
  - **filterDis** (Boolean) - Filter disambiguations. Default: `true`.
  - **filterDisDeep** (Boolean) - Filter disambiguation pages by testing parent categories. Default: `false`. Useful for filtering `hndis`, etc.

### Entity object:

- **name** (String) - Entity name;
- **type** (String) - Entity type: `place`, `person`, `group`;
- **wikiId** (Number) - Wikipedia page id;
- **lang** (String) - Language code.
- **wikiPage** (Object) - Wikipedia page info:
  - **title** (String) - Wikipedia page title;
  - **pageid** (Number) - Wikipedia page id;
  - **langlinks** (Object[]) - Wikipedia langlinks:
  - **redirects** (Object[]) - Wikipedia redirects:
  - **categories** (Object[]) - Wikipedia categories:
  - **simpleName** (String) - Entity simple name;
  - **specialName** (String) - Entity special name;
- **details** (Object) - Entity details:
- **names** (String[]) - An array of alt names;


## Algorithm

1. Find wikipedia names: dezambiguizations, ...
2. For found names get wikipedia pages;
3. Filter pages;
4. For every wikipedia page find details;

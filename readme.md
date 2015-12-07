# entity-finder

A nodejs Named entity finder. **entity-finder** will find the internet(wikipedia, ...) for an entity and return the most correct answers.


## API

### find(name, lang, options)

Finds entities. Returns an array of entities ordered by relevance.

- **name** (String), required - Entity name: `Italy`.
- **lang** (String), required - Language 2 chars code: `en`.
- **options** (Object), optional - Options object:
  - **country** (String) - Country 2 chars code: `us`. Entity regional context. Very useful when we have many people(entities) with same name in different countries.
  - **limit** (Number) - Maxim number of entities to return. Default: 2.
  - **props** (Object) - Properties to get:
    - **details** (Boolean) - Entity details. Default: `true`.

### Entity object:

- **name** (String) - Entity name;
- **type** (String) - Entity type: `place`, `person`, `group`;
- **wikiPage** (Object) - Wikipedia page info:
  - **title** (String) - Wikipedia page title;
  - **pageid** (Number) - Wikipedia page id;
  - **langlinks** (Object[]) - Wikipedia langlinks:
  - **redirects** (Object[]) - Wikipedia redirects:
  - **categories** (Object[]) - Wikipedia categories:
- **details** (Object) - Entity details:
- **simpleName** (String) - Entity simple name;
- **specialName** (String) - Entity special name;


## Algorithm

1. Find wikipedia names: dezambiguizations, ...
2. For every name find wikipedia page;
3. For every wikipedia page find details;

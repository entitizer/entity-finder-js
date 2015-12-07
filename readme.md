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
    - **type** (Boolean) - Entity type: `person`, `place`, `group`. Default: `true`.


## Algorithm

1. Find wikipedia names: dezambiguizations
2. For every name find props:
  1. Page info: **id**, **title**, etc.
  2. **langlinks** (Object[]) - an array of lang links;
  3. **redirects** (Object[]) - an array of redirects pages;
  4. **categories** (Object[]) - an array of categories;
  5. **type** (String) - entity type: `person`, `place`, `group`;

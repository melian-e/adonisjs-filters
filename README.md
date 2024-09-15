# Filters for Adonis App

> Filter your models with this package

This repo provides two methods allowing you to filter, paginate and order a request easily in a typesafe way. This package is thought for a postgres database.

## Setup

- Install the package with :

  ```sh
  npm i adonisjs-filters
  ```

## Methods

### simpleFilter

Exemple of use :
`app/controllers/users_controller.ts`

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { simpleFilter } from 'adonisjs-filters'

export default class UsersController {
    public async getAll(ctx: HttpContext) {
        let baseQuery = User.query().preload('country')

        const filter = await simpleFilter(ctx, baseQuery, ['fullName','email'], //Here are the columns taht you want to filter 
        [{relationColumns: ['name'], relationName: 'country'}]) //Here are the columns of the realtion of you class you may want to filter

        return await filter
    } 
}
```

Exemple of how to call the route :

```typescript
 await fetch(url, {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json'
   },
   body: JSON.stringify(options)
  });
```

```typescript
type SimpleOptions = {
  filter: string;
  page: number;
  limit: number;
  orderBy: string;
  order: string;
 }
```

### advancedFilter

Exemple of use :
`app/controllers/users_controller.ts`

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Country from "#models/country"
import { advancedFilter } from 'adonisjs-filters'

export default class CountriesController {
    public async getAll(ctx: HttpContext) {
        let baseQuery = Country.query().select('id', 'name')

        const filter = await advancedFilter(ctx, baseQuery)

        return await filter
    }
}
```

Exemple of how to call the route :

```typescript
 await fetch(url, {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json'
   },
   body: JSON.stringify(options)
  });
```

```typescript
type AdvancedOptions = {
  filters: {
   type: string;
   filtersDepth1: {
    type: string;
    filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
   }[];
  };
  page: number;
  limit: number;
  orderBy: string;
  order: string;
 }
```
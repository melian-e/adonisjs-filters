import { simpleFilterValidator } from '../validators/simple_filter.js'
import { HttpContext } from '@adonisjs/core/http'
import { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { Knex } from 'knex'
import PostgresDataNumbers from '../postgres_data_type/postgres_data_number.js'
import PostgresDataStrings from '../postgres_data_type/postgres_data_string.js'
import { ExtractModelColumns } from '../types/model_columns_extractor.js'
import { ExtractModelRelations } from '@adonisjs/lucid/types/relations'
import { ExtractModel } from '../types/model_extractor.js'
import string from '@adonisjs/core/helpers/string'

export async function simpleFilter<
  Model extends LucidModel,
  RelationName extends ExtractModelRelations<InstanceType<Model>>,
>(
  { request }: HttpContext,
  baseQuery: ModelQueryBuilderContract<Model, InstanceType<Model>>,
  columnFilter?: [
    ExtractModelColumns<InstanceType<Model>>,
    ...ExtractModelColumns<InstanceType<Model>>[],
  ],
  relationFilters?: {
    relationName: RelationName & string
    relationColumns: [
      ExtractModelColumns<InstanceType<ExtractModel<InstanceType<Model>, RelationName>>>,
      ...ExtractModelColumns<InstanceType<ExtractModel<InstanceType<Model>, RelationName>>>[],
    ]
  }[],
  options?: {
    filtered?: boolean
    paginated?: boolean
    ordered?: boolean
  }
): Promise<ModelQueryBuilderContract<Model, InstanceType<Model>>> {
  options = {
    filtered: options?.filtered ?? true,
    paginated: options?.paginated ?? true,
    ordered: options?.ordered ?? true,
  }

  const { filter, limit, page, order, orderBy } = await simpleFilterValidator.validate(
    request.all()
  )

  const Model = baseQuery.model

  let bddRequest = baseQuery

  if (options?.filtered !== false && filter && filter !== '') {
    if (columnFilter?.length === 0) {
      throw new Error('You must provide at least one column to filter')
    }

    let asserter: {
      [column: string]: Knex.ColumnInfo
    }

    if (columnFilter) {
      asserter = await Model.query().client.columnsInfo(Model.table)
    }

    let asserters: {
      [column: string]: Knex.ColumnInfo
    }[] = []

    for (const relation of relationFilters ?? []) {
      const TemporaryModel = Model.$getRelation(relation.relationName).relatedModel()

      asserters.push(
        await TemporaryModel.$adapter
          .modelClient(new TemporaryModel())
          .columnsInfo(TemporaryModel.table)
      )
    }

    bddRequest.andWhere((queryGroup) => {
      if (columnFilter) {
        columnFilter.forEach((column) => {
          if (isColumnNumber(asserter, column) && !Number.isNaN(Number(filter))) {
            queryGroup.orWhere(column, filter)
          } else if (isColumnString(asserter, column)) {
            queryGroup.orWhere(column, 'like', `%${filter}%`)
          }
        })
      }

      for (const [index, relation] of (relationFilters ?? []).entries()) {
        for (const column of relation.relationColumns) {
          if (isColumnNumber(asserters[index], column) && !Number.isNaN(Number(filter))) {
            queryGroup.orWhereHas(relation.relationName, (query) => {
              query.where(column, filter)
            })
          } else if (isColumnString(asserters[index], column)) {
            queryGroup.orWhereHas(relation.relationName, (query) => {
              query.where(column, 'like', `%${filter}%`)
            })
          }
        }
      }
    })
  }

  if (
    options?.ordered !== false &&
    orderBy &&
    orderBy !== '' &&
    (order === 'asc' || order === 'desc')
  ) {
    bddRequest.orderBy(string.snakeCase(orderBy), order)
  } else {
    bddRequest.orderBy('id', 'asc')
  }

  if (options?.paginated !== false && limit && page) {
    return bddRequest.paginate(page, limit)
  } else if (limit) {
    return bddRequest.limit(limit)
  }

  return bddRequest
}

function isColumnNumber(
  asserter: {
    [column: string]: Knex.ColumnInfo
  },
  test: any
): test is String {
  console.log('arg', asserter, test)

  if (PostgresDataNumbers.includes(asserter[camelCaseToSnake(test)].type)) {
    return true
  } else {
    return false
  }
}

function isColumnString(
  asserter: {
    [column: string]: Knex.ColumnInfo
  },
  test: any
): test is String {
  if (PostgresDataStrings.includes(asserter[camelCaseToSnake(test)].type)) {
    return true
  } else {
    return false
  }
}

function camelCaseToSnake(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

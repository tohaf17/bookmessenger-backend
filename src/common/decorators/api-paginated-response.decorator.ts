import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          pagination: {
            type: 'object',
            properties: {
              totalItems: { type: 'number', example: 42 },
              currentPage: { type: 'number', example: 1 },
              itemsPerPage: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 5 },
            },
          },
        },
      },
    }),
  );

import { SelectQueryBuilder } from 'typeorm';
import { Book } from '../book.entity';
import { BookQueryRequest } from '../requests/book-query.request';

export interface BookFilterStrategy {
  apply(
    queryBuilder: SelectQueryBuilder<Book>,
    params: BookQueryRequest,
  ): void;
}

import { SelectQueryBuilder } from 'typeorm';
import { Book } from '../book.entity';
import { BookQueryRequest } from '../requests/book-query.request';
import { BookFilterStrategy } from './book-filter-strategy';

export class BookSearchFilterStrategy implements BookFilterStrategy {
  apply(
    queryBuilder: SelectQueryBuilder<Book>,
    params: BookQueryRequest,
  ): void {
    if (!params.search?.trim()) {
      return;
    }

    queryBuilder.andWhere(
      '(book.title ILIKE :search OR book.authorName ILIKE :search OR book.description ILIKE :search)',
      { search: `%${params.search.trim()}%` },
    );
  }
}

import { SelectQueryBuilder } from 'typeorm';
import { Book } from '../book.entity';
import { BookQueryRequest } from '../requests/book-query.request';
import { BookFilterStrategy } from './book-filter-strategy';

export class BookGenreFilterStrategy implements BookFilterStrategy {
  apply(
    queryBuilder: SelectQueryBuilder<Book>,
    params: BookQueryRequest,
  ): void {
    if (!params.genre?.trim()) {
      return;
    }

    queryBuilder.andWhere('book.genre ILIKE :genre', {
      genre: `%${params.genre.trim()}%`,
    });
  }
}

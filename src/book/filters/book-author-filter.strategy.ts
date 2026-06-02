import { SelectQueryBuilder } from 'typeorm';
import { Book } from '../book.entity';
import { BookQueryRequest } from '../requests/book-query.request';
import { BookFilterStrategy } from './book-filter-strategy';

export class BookAuthorFilterStrategy implements BookFilterStrategy {
  apply(
    queryBuilder: SelectQueryBuilder<Book>,
    params: BookQueryRequest,
  ): void {
    if (!params.author?.trim()) {
      return;
    }

    queryBuilder.andWhere('book.authorName ILIKE :author', {
      author: `%${params.author.trim()}%`,
    });
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../comment.entity';

export class CommentResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  bookId!: number;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: () => [CommentResponse], description: 'Список відповідей на коментар' })
  replies!: CommentResponse[];

  @ApiProperty()
  user?: {
    id: number;
    name: string;
    surname: string;
  };

  constructor(comment: Comment) {
    this.id = comment.id;
    this.userId = comment.userId;
    this.bookId = comment.bookId;
    this.content = comment.text;
    this.createdAt = comment.createdAt;
    this.replies = comment.replies
      ? comment.replies.map((reply) => new CommentResponse(reply))
      : [];
    if (comment.user) {
      this.user = {
        id: comment.user.id,
        name: comment.user.name,
        surname: comment.user.surname,
      };
    }
  }
}

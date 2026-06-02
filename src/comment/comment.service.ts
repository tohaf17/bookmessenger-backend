import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull } from 'typeorm';
import { PaginationRequest } from '../common/requests/paginationDto';
import { PaginatedResponse } from '../common/responses/paginationResponse';
import { Comment } from './comment.entity';
import { CreateCommentRequest } from './requests/create-comment.request';
import { UpdateCommentRequest } from './requests/update-comment.request';
import { CommentResponse } from './responses/comment.response';
import { UserRole } from '../user/user-role.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: TreeRepository<Comment>,
  ) {}

  async create(
    data: CreateCommentRequest,
    userId: number,
  ): Promise<CommentResponse> {
    const comment = this.commentRepository.create({
      ...data,
      userId,
      createdAt: new Date(),
    });

    await this.commentRepository.save(comment);
    return new CommentResponse(await this.findCommentEntity(comment.id));
  }

  async findAll(
    params: PaginationRequest,
    bookId?: number,
  ): Promise<PaginatedResponse<CommentResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;

    const where = bookId
      ? { book: { id: bookId }, parent: IsNull() }
      : { parent: IsNull() };

    const [comments, commentsCount] = await this.commentRepository.findAndCount(
      {
        take: quantity,
        skip,
        order: { id: 'DESC' },
        where,
        relations: { user: true, book: true, replies: { user: true, book: true } },
      },
    );

    return {
      data: comments.map((comment) => new CommentResponse(comment)),
      pagination: {
        totalItems: commentsCount, 
        currentPage: page,
        itemsPerPage: quantity,
        totalPages: Math.ceil(commentsCount / quantity),
      },
    };
  }
  async reply(content:string, userId:number, parentId:number, bookId:number):Promise<CommentResponse>{
    const reply = this.commentRepository.create({
      text: content,
      user: { id: userId },
      book: { id: bookId },
      parent: { id: parentId },
      createdAt: new Date(),
    });
    await this.commentRepository.save(reply);
    return new CommentResponse(await this.findCommentEntity(reply.id));
  }

  async findOne(id: number): Promise<CommentResponse> {
    const comment = await this.findCommentEntity(id);
    return new CommentResponse(comment);
  }

  async update(
    id: number,
    data: UpdateCommentRequest,
    userId: number,
    userRole: UserRole,
  ): Promise<CommentResponse> {
    const comment = await this.findCommentEntity(id);
    this.assertOwnerOrAdmin(comment, userId, userRole);
    Object.assign(comment, data);
    await this.commentRepository.save(comment);
    return new CommentResponse(await this.findCommentEntity(id));
  }

  async remove(
    id: number,
    userId: number,
    userRole: UserRole,
  ): Promise<CommentResponse> {
    const comment = await this.findCommentEntity(id);
    this.assertOwnerOrAdmin(comment, userId, userRole);
    await this.removeCommentTree(comment);
    return new CommentResponse(comment);
  }

  private async findCommentEntity(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ 
      where: { id },
      relations: { user: true, book: true, replies: { user: true, book: true } }, 
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  private assertOwnerOrAdmin(
    comment: Comment,
    userId: number,
    userRole: UserRole,
  ): void {
    if (comment.userId === userId || userRole === UserRole.Admin) {
      return;
    }

    throw new ForbiddenException('You can modify only your own comments');
  }

  private async removeCommentTree(comment: Comment): Promise<void> {
    const children = await this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.parentId = :id', { id: comment.id })
      .getMany();

    for (const child of children) {
      await this.removeCommentTree(child);
    }

    await this.commentRepository.remove(comment);
  }
}

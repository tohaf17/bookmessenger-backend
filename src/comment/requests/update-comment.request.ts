import { PartialType } from '@nestjs/swagger';
import { CreateCommentRequest } from './create-comment.request';

export class UpdateCommentRequest extends PartialType(CreateCommentRequest) {}

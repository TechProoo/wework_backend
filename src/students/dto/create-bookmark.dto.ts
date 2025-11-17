import { IsString, IsIn } from 'class-validator';

const VALID_TYPES = ['JOB', 'COURSE'] as const;

export class CreateBookmarkDto {
  @IsIn(VALID_TYPES as any)
  type!: 'JOB' | 'COURSE';

  @IsString()
  targetId!: string;
}

export default CreateBookmarkDto;

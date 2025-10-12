import { Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  create(createStudentDto: CreateStudentDto) {
    return {
      message: 'This action adds a new student',
      student: createStudentDto,
    };
  }
}

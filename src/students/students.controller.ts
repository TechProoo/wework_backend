import { Controller, Post, Body } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('signup')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.signUp(createStudentDto);
  }
}

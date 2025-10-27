import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  async create(@Body() createCourseDto: CreateCourseDto) {
    const data = await this.coursesService.create(createCourseDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Course created',
      data,
    };
  }

  @Get()
  async findAll() {
    const data = await this.coursesService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Courses retrieved',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.coursesService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Course retrieved',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    const data = await this.coursesService.update(id, updateCourseDto as any);
    return {
      statusCode: HttpStatus.OK,
      message: 'Course updated',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.coursesService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Course deleted',
      data,
    };
  }

  @Post(':id/lessons')
  createLesson(
    @Param('id') id: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson(id, createLessonDto as any);
  }

  @Post(':id/tutorial')
  createTutorial(@Param('id') id: string, @Body() body: any) {
    return this.coursesService.createTutorial(id, body as any);
  }

  @Patch(':id/tutorial')
  updateTutorial(@Param('id') id: string, @Body() body: any) {
    return this.coursesService.updateTutorial(id, body as any);
  }

  @Delete(':id/tutorial')
  deleteTutorial(@Param('id') id: string) {
    return this.coursesService.deleteTutorial(id);
  }

  @Get(':id/lessons')
  listLessons(@Param('id') id: string) {
    return this.coursesService.listLessons(id);
  }

  @Get('/lessons/:lessonId')
  getLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.getLesson(lessonId);
  }

  @Patch('/lessons/:lessonId')
  updateLesson(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.updateLesson(lessonId, body as any);
  }

  @Delete('/lessons/:lessonId')
  deleteLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.deleteLesson(lessonId);
  }

  @Post('/lessons/:lessonId/quiz')
  createQuiz(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.createQuizForLesson(lessonId, body as any);
  }

  @Patch(':id/publish')
  setPublished(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.coursesService.setPublished(id, Boolean(isPublished));
  }

  @Post('import')
  import(@Body() payload: any) {
    return this.coursesService.importCourse(payload as any);
  }
}

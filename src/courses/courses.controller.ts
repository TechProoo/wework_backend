import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Public } from 'src/decorators/public.decorator';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudinaryService: CloudinaryService, // ✅ Inject Cloudinary
  ) {}

  // ✅ Create Course with optional file upload (image or video)
  @Public()
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createCourseDto: CreateCourseDto,
  ) {
    try {
      let thumbnailUrl: string | null = null;
      const lessonUploads: Record<string, string> = {}; // maps filename to Cloudinary URL

      // ✅ Upload all files to Cloudinary
      if (files?.length) {
        for (const file of files) {
          const uploadResult = await this.cloudinaryService.uploadFile(
            file,
            'courses',
          );
          const fileUrl = (uploadResult as any)?.secure_url ?? null;

          if (file.mimetype.startsWith('image/')) {
            // assume this is the course thumbnail
            thumbnailUrl = fileUrl;
          } else if (file.mimetype.startsWith('video/')) {
            // assume this is a lesson video, use filename to map
            lessonUploads[file.originalname] = fileUrl;
          }
        }
      }

      // ✅ Merge uploaded lesson videos into the course data
      const updatedLessons = (createCourseDto.lessons || []).map((l: any) => ({
        ...l,
        videoUrl: lessonUploads[l.videoFileName] ?? l.videoUrl ?? null, // match by file name
      }));

      // ✅ Create the course record
      const data = await this.coursesService.create({
        ...createCourseDto,
        thumbnail: thumbnailUrl ?? createCourseDto.thumbnail,
        lessons: updatedLessons,
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Course created successfully',
        data,
      };
    } catch (error) {
      console.error('Error creating course:', error);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create course',
        error: error.message,
      };
    }
  }

  // 🔹 Get all courses
  @Get()
  async findAll() {
    const data = await this.coursesService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Courses retrieved',
      data,
    };
  }

  // 🔹 Get single course
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.coursesService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Course retrieved',
      data,
    };
  }

  // 🔹 Update course (metadata only)
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

  // 🔹 Delete course
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.coursesService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Course deleted',
      data,
    };
  }

  // 🔹 Create Lesson
  @Post(':id/lessons')
  createLesson(
    @Param('id') id: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson(id, createLessonDto as any);
  }

  // 🔹 Tutorial Management
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

  // 🔹 Lesson Endpoints
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

  // 🔹 Lesson Quiz
  @Post('/lessons/:lessonId/quiz')
  createQuiz(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.createQuizForLesson(lessonId, body as any);
  }

  // 🔹 Publish Course
  @Patch(':id/publish')
  setPublished(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.coursesService.setPublished(id, Boolean(isPublished));
  }

  // 🔹 Import Courses
  @Post('import')
  import(@Body() payload: any) {
    return this.coursesService.importCourse(payload as any);
  }
}

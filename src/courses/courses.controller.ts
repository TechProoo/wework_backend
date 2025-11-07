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
  @Public()
  @Get()
  async findAll() {
    const data = await this.coursesService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Courses retrieved',
      data,
    };
  }

  @Public()
  @Get('count')
  async getTotalCourses() {
    const total = await this.coursesService.getTotalCourses();
    return {
      statusCode: HttpStatus.OK,
      message: 'Total Courses fetched successfully',
      data: { total },
    };
  }

  // 🔹 Get single course
  @Public()
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
  @Public()
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

  // ✅ Upload a single thumbnail image and update course.thumbnail
  @Public()
  @Post(':id/thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // upload to Cloudinary and update course record
    const uploadResult = await this.cloudinaryService.uploadFile(
      file,
      'courses',
    );
    const fileUrl = (uploadResult as any)?.secure_url ?? null;
    if (!fileUrl) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to upload thumbnail',
      };
    }

    const data = await this.coursesService.update(id, {
      thumbnail: fileUrl,
    } as any);
    return {
      statusCode: HttpStatus.OK,
      message: 'Thumbnail uploaded and course updated',
      data,
    };
  }

  // 🔹 Delete course
  @Public()
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
  @Public()
  @Post(':id/lessons')
  createLesson(
    @Param('id') id: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson(id, createLessonDto as any);
  }

  // 🔹 Lesson Endpoints

  @Public()
  @Get(':id/lessons')
  listLessons(@Param('id') id: string) {
    return this.coursesService.listLessons(id);
  }

  @Public()
  @Get('/lessons/:lessonId')
  getLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.getLesson(lessonId);
  }

  @Public()
  @Patch('/lessons/:lessonId')
  updateLesson(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.updateLesson(lessonId, body as any);
  }

  @Public()
  @Delete('/lessons/:lessonId')
  deleteLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.deleteLesson(lessonId);
  }

  // 🔹 Lesson Quiz
  @Public()
  @Post('/lessons/:lessonId/quiz')
  createQuiz(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.createQuizForLesson(lessonId, body as any);
  }

  @Public()
  @Patch('/lessons/:lessonId/quiz')
  updateQuiz(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.coursesService.updateQuizForLesson(lessonId, body as any);
  }

  @Public()
  @Delete('/lessons/:lessonId/quiz')
  deleteQuiz(@Param('lessonId') lessonId: string) {
    return this.coursesService.deleteQuizForLesson(lessonId);
  }

  // 🔹 Publish Course
  @Public()
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

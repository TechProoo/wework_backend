export class CreateCourseDto {
  title: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  thumbnail?: string;
  description?: string;

  // optional tutorial data to create alongside the course
  tutorialTitle?: string;
  tutorialContent?: string;
  tutorialVideoUrl?: string;
}

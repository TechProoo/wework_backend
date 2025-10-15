import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Public } from '../decorators/public.decorator';
import { LoginCompanyDto } from './dto/login-company.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() createCompanyDto: CreateCompanyDto) {
    const company = await this.companiesService.signUp(createCompanyDto); // ✅ Added await

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Company account created successfully',
      data: company,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginCompanyDto) {
    const token = await this.companiesService.login(loginDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: token,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('logout')
  logout(@Request() req: { logout: () => void }): { message: string } {
    req.logout();
    return { message: 'Logout successful' };
  }

  @Get('profile')
  getProfile(@Request() req: { user: any }): any {
    return req.user;
  }
}

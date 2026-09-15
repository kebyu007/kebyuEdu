import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { getMulterOptions } from '@/common/utils/file-upload.util';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users', 'create')
  @UseInterceptors(
    FileInterceptor('photo', getMulterOptions('profile_pictures')),
  )
  @ApiOperation({ summary: 'Yangi foydalanuvchi yaratish' })
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      createUserDto.photo = file.path; // Bazaga yozish uchun path ni beramiz
    }
    return this.usersService.create(createUserDto, file);
  }

  @Get()
  @RequirePermissions('users', 'read')
  findAll(@Query() filterDto: FilterUserDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get(':id')
  @RequirePermissions('users', 'read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermissions('users', 'update')
  @UseInterceptors(
    FileInterceptor('photo', getMulterOptions('profile_pictures')),
  )
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateUserDto.photo = file.path;
    }
    return this.usersService.update(+id, updateUserDto, file);
  }

  @Delete(':id')
  @RequirePermissions('users', 'delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

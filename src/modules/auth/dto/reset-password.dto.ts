import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: '123456',
    description:
      'Emailga borgan 6 xonali OTP yoki Telegramdan kelgan UUID Token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'new_secret_pass', description: 'Yangi parol' })
  @IsString()
  @Length(6, 50)
  newPassword: string;
}

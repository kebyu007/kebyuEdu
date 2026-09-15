import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionRequirements {
  module: string;
  action: string;
}

export const RequirePermissions = (module: string, action: string) => {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, { module, action }),
    ApiBearerAuth(),
  );
};

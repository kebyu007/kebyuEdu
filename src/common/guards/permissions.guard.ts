import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PermissionRequirements,
} from '../decorators/permissions.decorator';
import { UserRoles } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionRequirements>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    // Agar metodga ruxsatlar (permissions) so'ralmagan bo'lsa, davom etishga ruxsat
    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Superadmin hamma narsaga ruxsatga ega
    if (user.role === UserRoles.SUPERADMIN) {
      return true;
    }

    // User'ning JSON attributelarini olamiz
    const attributes = user.attributes;

    if (!attributes || !attributes.permissions) {
      throw new ForbiddenException(
        "Sizda ushbu moduldan foydalanish uchun huquqlar o'rnatilmagan",
      );
    }

    const userPermissions = attributes.permissions;
    const { module, action } = requiredPermission;

    // So'ralayotgan modul ruxsatnomalar ichida bormi va tegishli action yoqilganmi? (yoki yulduzcha - hamma narsaga ruxsat berilganmi)
    const hasModuleAccess = userPermissions[module] || userPermissions['*'];

    if (hasModuleAccess) {
      const allowedActions = userPermissions[module] || userPermissions['*'];
      if (allowedActions.includes(action) || allowedActions.includes('*')) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Sizda '${module}' modulida '${action}' amalini bajarish huquqi yo'q`,
    );
  }
}

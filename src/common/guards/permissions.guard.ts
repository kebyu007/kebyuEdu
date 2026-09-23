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

    if (String(user.role).trim().toUpperCase() === 'TEACHER') {
      const { module, action } = requiredPermission;
      const allowedModules = [
        'groups',
        'homeworks',
        'exams',
        'journal',
        'attendance',
        'lessons',
        'lesson_videos',
        'lesson-videos',
      ];

      if (allowedModules.includes(module)) {
        return true;
      }
    }

    // User'ning JSON attributelarini olamiz
    const attributes = user.attributes;
    const { module, action } = requiredPermission;

    if (!attributes || !attributes.permissions) {
      const fs = require('fs');
      fs.appendFileSync(
        '/tmp/nest-debug.log',
        `[PermissionsGuard Debug] FAILURE: Role=${user.role}, module=${module}, action=${action}\n`,
      );
      console.log(
        `[PermissionsGuard Debug] 403 - No attributes for user ${user.id}, role: ${user.role}, requested: ${module}.${action}`,
      );
      throw new ForbiddenException(
        "Sizda ushbu moduldan foydalanish uchun huquqlar o'rnatilmagan",
      );
    }

    const userPermissions = attributes.permissions;

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

// This file is deprecated - app projects are now stored server-side
// Use atoms from @/state/app-ecosystem.ts for data access

export class AppProjectStorage {
  // Deprecated - kept for backward compatibility during migration
  static getAll() {
    console.warn('AppProjectStorage.getAll() is deprecated. Use projectsAtom from @/state/app-ecosystem.ts');
    return [];
  }

  static save() {
    console.warn('AppProjectStorage.save() is deprecated. Apps are now stored server-side.');
  }

  static create() {
    throw new Error('AppProjectStorage.create() is deprecated. Use createApp() from @/libs/anthropic.ts');
  }

  static update() {
    throw new Error('AppProjectStorage.update() is deprecated. Use updateAppSourceCode() from @/libs/anthropic.ts');
  }

  static delete() {
    throw new Error('AppProjectStorage.delete() is deprecated. Use server API directly.');
  }

  static getById() {
    console.warn('AppProjectStorage.getById() is deprecated. Use projectByIdAtom from @/state/app-ecosystem.ts');
    return null;
  }

  static duplicate() {
    throw new Error('AppProjectStorage.duplicate() is deprecated. Use server API directly.');
  }
}
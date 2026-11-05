export interface RoleOption { id: number; name: string; label: string }
export interface Role extends RoleOption { description: string | null; isActive: boolean }

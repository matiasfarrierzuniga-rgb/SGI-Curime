import type { FormEvent } from "react";
import type { RoleOption } from "../model/users.types";
import type { UserStatus } from "../model/users.types";

interface UserFiltersProps {
  name: string;
  onNameChange: (value: string) => void;
  status: UserStatus | "";
  onStatusChange: (value: UserStatus | "") => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  roles: RoleOption[];
  onSubmit: () => void;
}

export function UserFilters({
  name,
  onNameChange,
  status,
  onStatusChange,
  roleId,
  onRoleIdChange,
  roles,
  onSubmit,
}: UserFiltersProps) {
  return (
    <form
      className="filters card"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Búsqueda por nombre
        <input value={name} onChange={(e) => onNameChange(e.target.value)} />
      </label>
      <label>
        Estado
        <select
          value={status}
          onChange={(e) => {
            onStatusChange(e.target.value as UserStatus | "");
          }}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="BLOCKED">Bloqueado administrativo</option>
        </select>
      </label>
      <label>
        Rol
        <select value={roleId} onChange={(e) => onRoleIdChange(e.target.value)}>
          <option value="">Todos</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <button className="primary">Buscar</button>
    </form>
  );
}

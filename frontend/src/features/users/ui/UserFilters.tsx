import type { FormEvent } from "react";
import type { RoleOption } from "../model/users.types";
import type { UserStatus } from "../model/users.types";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/FormField";
import { SearchFilterBar, SearchFilterClear, SearchInput } from "@/shared/ui/SearchFilterBar";
import { Select } from "@/shared/ui/select";

interface UserFiltersProps {
  name: string;
  onNameChange: (value: string) => void;
  status: UserStatus | "";
  onStatusChange: (value: UserStatus | "") => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  roles: RoleOption[];
  onSubmit: () => void;
  onClear: () => void;
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
  onClear,
}: UserFiltersProps) {
  return (
    <SearchFilterBar
      className="gap-4 py-1"
      label="Buscar y filtrar usuarios"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit();
      }}
      onReset={onClear}
      actions={
        <>
          <SearchFilterClear />
          <Button type="submit">Buscar</Button>
        </>
      }
    >
      <FormField id="user-search" label="Buscar por nombre">
        <SearchInput
          value={name}
          placeholder="Nombre de la persona"
          onChange={(e) => onNameChange(e.target.value)}
        />
      </FormField>
      <fieldset className="flex min-w-0 flex-wrap gap-3 border-0 p-0">
        <legend className="sr-only">Filtros de usuarios</legend>
        <FormField id="user-status" label="Estado" className="min-w-36 flex-1">
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as UserStatus | "")}
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
            <option value="BLOCKED">Bloqueado administrativo</option>
          </Select>
        </FormField>
        <FormField id="user-role" label="Rol" className="min-w-40 flex-1">
          <Select value={roleId} onChange={(e) => onRoleIdChange(e.target.value)}>
            <option value="">Todos</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </FormField>
      </fieldset>
    </SearchFilterBar>
  );
}

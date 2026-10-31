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
      className="py-1"
      controlsClassName="sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(16rem,2fr)_minmax(9rem,1fr)_minmax(10rem,1fr)]"
      label="Buscar y filtrar usuarios"
      role="search"
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
      <FormField id="user-search" label="Buscar por nombre" className="min-w-0 md:col-span-2 xl:col-span-1">
        <SearchInput
          value={name}
          placeholder="Nombre de la persona"
          onChange={(e) => onNameChange(e.target.value)}
        />
      </FormField>
      <FormField id="user-status" label="Estado" className="min-w-0">
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
      <FormField id="user-role" label="Rol" className="min-w-0">
        <Select value={roleId} onChange={(e) => onRoleIdChange(e.target.value)}>
          <option value="">Todos</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </FormField>
    </SearchFilterBar>
  );
}

import { useState } from "react";
import { Pagination } from "@/shared/ui/Pagination";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { PageContainer } from "@/shared/ui/PageContainer";
import { PageHeader } from "@/shared/ui/PageHeader";
import type { UserStatus } from "../model/users.types";
import { getErrorMessage } from "@/shared/lib/errors";
import {
  useUserDetail,
  useUsersList,
  useRolesOptions,
} from "../hooks/useUsersQueries";
import { UserFilters } from "./UserFilters";
import { UsersTable } from "./UsersTable";
import { UserDetailsModal } from "./UserDetailsModal";

const limit = 10;

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [roleId, setRoleId] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filters = { page, limit, name: query, status, roleId: roleId ? Number(roleId) : 0 };
  const listQuery = useUsersList(filters);
  const rolesQuery = useRolesOptions();
  const detailQuery = useUserDetail(selectedId);

  const users = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const loading = listQuery.isPending;
  const error =
    listQuery.error
      ? getErrorMessage(listQuery.error, "No fue posible cargar los usuarios.")
      : rolesQuery.error
        ? getErrorMessage(rolesQuery.error, "No fue posible cargar los roles.")
        : "";
  const selected = detailQuery.data ?? null;

  const clearFilters = () => {
    setPage(1);
    setName("");
    setQuery("");
    setStatus("");
    setRoleId("");
  };

  const hasActiveFilters = Boolean(query || status || roleId);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        context="Administración"
        title="Usuarios"
        description="Consulte personas, sus cuentas SGI y la afiliación disponible."
      />
      <UserFilters
        name={name}
        onNameChange={setName}
        status={status}
        onStatusChange={(value) => {
          setPage(1);
          setStatus(value);
        }}
        roleId={roleId}
        onRoleIdChange={(value) => {
          setPage(1);
          setRoleId(value);
        }}
        roles={rolesQuery.data ?? []}
        onSubmit={() => {
          setPage(1);
          setQuery(name.trim());
        }}
        onClear={clearFilters}
      />
      <div className="flex flex-col gap-1 border-b border-border-subtle pb-3 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-body-small font-semibold text-text-primary">
          {loading ? "Cargando resultados…" : `${total} ${total === 1 ? "persona encontrada" : "personas encontradas"}`}
        </p>
        <p className="text-body-small text-text-secondary">Desplácese horizontalmente para ver todas las columnas.</p>
      </div>
      {error ? <ErrorState message={error} action={<Button type="button" variant="outline" onClick={() => { void listQuery.refetch(); void rolesQuery.refetch(); }}>Reintentar</Button>} /> : null}
      {!error && loading ? (
        <LoadingState label="Cargando usuarios…" />
      ) : !error && users.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No hay coincidencias" : "No hay personas registradas"}
          description={hasActiveFilters ? "Ajuste la búsqueda o limpie los filtros para consultar nuevamente." : "Las personas registradas aparecerán en este listado."}
          action={hasActiveFilters ? <Button type="button" variant="outline" onClick={clearFilters}>Limpiar filtros</Button> : undefined}
        />
      ) : (
        <>
          <UsersTable users={users} onOpen={setSelectedId} />
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onChange={setPage}
          />
        </>
      )}
      {selectedId !== null && (
        <UserDetailsModal
          selected={selected}
          loading={detailQuery.isPending}
          error={detailQuery.error ? getErrorMessage(detailQuery.error, "No fue posible cargar el detalle de la persona.") : null}
          onRetry={() => { void detailQuery.refetch(); }}
          onClose={() => {
            setSelectedId(null);
          }}
        />
      )}
    </PageContainer>
  );
}

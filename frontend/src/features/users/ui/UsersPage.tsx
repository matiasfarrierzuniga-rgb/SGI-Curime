import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pagination } from "@/shared/ui/Pagination";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { PageContainer } from "@/shared/ui/PageContainer";
import { PageHeader } from "@/shared/ui/PageHeader";
import type { User, UserStatus, UserUpdate } from "../model/users.types";
import { getErrorMessage } from "@/shared/lib/errors";
import {
  useUserDetail,
  useUsersList,
  useRolesOptions,
} from "../hooks/useUsersQueries";
import { UserFilters } from "./UserFilters";
import { UsersTable } from "./UsersTable";
import { UserDetailsModal } from "./UserDetailsModal";
import { UserManagementDialogs } from "./UserManagementDialogs";
import { usersService } from "../api/users.api";
import { usersKeys } from "../hooks/useUsersQueries";
import { useToast } from "@/shared/ui/Toast";

type ManagementAction = "edit" | "role" | "activate" | "deactivate" | "unlock";

const limit = 10;

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [roleId, setRoleId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [management, setManagement] = useState<{ user: User; action: ManagementAction } | null>(null);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const filters = { page, limit, name: query, status: status || undefined, roleId: roleId ? Number(roleId) : 0 };
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
  const mutation = useMutation({
    mutationFn: async ({ action, user, payload }: { action: ManagementAction; user: User; payload?: UserUpdate | number }) => {
      const access = user.access;
      const permitted = action === "edit"
        ? user.actions.update
        : action === "role"
          ? user.actions.changeRole
          : action === "unlock"
            ? user.actions.unlock && access?.isTemporarilyLocked
            : action === "activate"
              ? user.actions.manageLifecycle && access?.status === "INACTIVE"
              : user.actions.manageLifecycle && access?.status === "ACTIVE";
      if (!access || !permitted) throw new Error("La acción de cuenta solicitada no está disponible para esta persona.");

      const accessId = access.id;
      if (action === "edit") return usersService.update(accessId, payload as UserUpdate);
      if (action === "role") return usersService.changeRole(accessId, payload as number);
      if (action === "activate") return usersService.activate(accessId);
      if (action === "deactivate") return usersService.deactivate(accessId);
      return usersService.unlock(accessId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.all });
      setManagement(null);
      notify("Cambios de cuenta SGI guardados.", "success");
    },
  });

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
           <UsersTable users={users} onOpen={setSelectedId} onManage={(user, action) => setManagement({ user, action })} />
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
      <UserManagementDialogs
        action={management?.action ?? null}
        user={management?.user ?? null}
        roles={rolesQuery.data ?? []}
        busy={mutation.isPending}
        error={mutation.error ? getErrorMessage(mutation.error, "No fue posible actualizar la cuenta SGI.") : null}
        onClose={() => { if (!mutation.isPending) setManagement(null); }}
        onUpdate={(payload) => management && mutation.mutate({ action: "edit", user: management.user, payload })}
        onChangeRole={(roleId) => management && mutation.mutate({ action: "role", user: management.user, payload: roleId })}
        onLifecycle={(action) => management && mutation.mutate({ action, user: management.user })}
      />
    </PageContainer>
  );
}

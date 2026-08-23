import { useEffect, useState } from "react";
import { Pagination } from "@/shared/ui/Pagination";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { UserStatus } from "../model/users.types";
import { getErrorMessage } from "@/shared/lib/errors";
import { useToast } from "@/shared/ui/Toast";
import { normalizeEmail, normalizeText, personContactErrors } from "@/shared/lib/formValidation";
import {
  useUserDetail,
  useUsersList,
  useUserMutations,
  useRolesOptions,
} from "../hooks/useUsersQueries";
import { UserFilters } from "./UserFilters";
import { UsersTable } from "./UsersTable";
import { UserDetailsModal, type UsersDialogMode } from "./UserDetailsModal";
import { EditUserModal, type UserEditForm } from "./EditUserModal";
import { ChangeRoleModal } from "./ChangeRoleModal";

const limit = 10;

const emptyForm: UserEditForm = {
  fullName: "",
  email: "",
  phoneCountryCode: "+506",
  phoneNationalNumber: "",
  address: "",
  roleId: "",
};

export function UsersPage() {
  const { notify } = useToast();
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [roleId, setRoleId] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<UsersDialogMode>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<UserEditForm>(emptyForm);

  const filters = { page, limit, name: query, status, roleId: roleId ? Number(roleId) : 0 };
  const listQuery = useUsersList(filters);
  const rolesQuery = useRolesOptions();
  const detailQuery = useUserDetail(selectedId);
  const mutations = useUserMutations();

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
  const busy =
    mutations.update.isPending ||
    mutations.changeRole.isPending ||
    mutations.activate.isPending ||
    mutations.deactivate.isPending ||
    mutations.unlock.isPending ||
    detailQuery.isFetching;

  useEffect(() => {
    if (selected) {
      setForm({
        fullName: selected.fullName,
        email: selected.email,
        phoneCountryCode: selected.phoneCountryCode ?? "+506",
        phoneNationalNumber: selected.phoneNationalNumber ?? "",
        address: selected.address ?? "",
        roleId: String(selected.roleId),
      });
    }
  }, [selected]);

  const run = async () => {
    if (!selected || !mode || busy) return;
    if (mode === "edit") {
      const nextErrors = personContactErrors(form);
      setFieldErrors(nextErrors);
      if (Object.values(nextErrors).some(Boolean)) return;
    }
    try {
      if (mode === "edit")
        await mutations.update.mutateAsync({
          id: selected.id,
          payload: {
            fullName: normalizeText(form.fullName),
            email: normalizeEmail(form.email),
            phoneCountryCode: form.phoneNationalNumber
              ? normalizeText(form.phoneCountryCode)
              : undefined,
            phoneNationalNumber: form.phoneNationalNumber.trim() || undefined,
            address: normalizeText(form.address) || undefined,
          },
        });
      if (mode === "role")
        await mutations.changeRole.mutateAsync({
          id: selected.id,
          roleId: Number(form.roleId),
        });
      if (mode === "activate") await mutations.activate.mutateAsync(selected.id);
      if (mode === "deactivate")
        await mutations.deactivate.mutateAsync(selected.id);
      if (mode === "unlock") await mutations.unlock.mutateAsync(selected.id);
      notify("Usuario actualizado correctamente.", "success");
      setMode(null);
    } catch (e) {
      notify(getErrorMessage(e), "error");
    }
  };

  return (
    <section>
      <h1>Administración de usuarios</h1>
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
      />
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p aria-live="polite">Cargando usuarios…</p>
      ) : users.length === 0 ? (
        <p className="card">No hay usuarios que coincidan con los filtros.</p>
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
      {selected && (
        <UserDetailsModal
          selected={selected}
          busy={busy}
          onClose={() => {
            setSelectedId(null);
            setFieldErrors({});
          }}
          onMode={(nextMode) => {
            setFieldErrors({});
            setMode(nextMode);
          }}
        />
      )}
      {mode === "edit" && (
        <EditUserModal
          form={form}
          onFormChange={setForm}
          fieldErrors={fieldErrors}
          busy={busy}
          onClose={() => setMode(null)}
          onSubmit={() => void run()}
        />
      )}
      {mode === "role" && (
        <ChangeRoleModal
          form={form}
          onFormChange={setForm}
          roles={rolesQuery.data ?? []}
          busy={busy}
          onClose={() => setMode(null)}
          onConfirm={() => void run()}
        />
      )}
      {mode && !["edit", "role"].includes(mode) && (
        <ConfirmDialog
          title="Confirmar acción"
          message={`¿Deseas ${mode === "activate" ? "activar" : mode === "deactivate" ? "inactivar" : "desbloquear"} esta cuenta?`}
          confirmLabel={mode === "deactivate" ? "Inactivar cuenta" : "Confirmar"}
          danger={mode === "deactivate"}
          busy={busy}
          onClose={() => setMode(null)}
          onConfirm={() => void run()}
        />
      )}
    </section>
  );
}

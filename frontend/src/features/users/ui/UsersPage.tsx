import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/shared/ui/Pagination";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { usersService } from "../api/users.api";
import { rolesService } from "@/services/rolesService";
import type { RoleOption, User, UserStatus } from "../model/users.types";
import { getErrorMessage } from "@/shared/lib/errors";
import { useToast } from "@/shared/ui/Toast";
import { normalizeEmail, normalizeText, personContactErrors } from "@/shared/lib/formValidation";
import { UserFilters } from "./UserFilters";
import { UsersTable } from "./UsersTable";
import { UserDetailsModal, type UsersDialogMode } from "./UserDetailsModal";
import { EditUserModal, type UserEditForm } from "./EditUserModal";
import { ChangeRoleModal } from "./ChangeRoleModal";

const limit = 10;

export function UsersPage() {
  const { notify } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [roleId, setRoleId] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [mode, setMode] = useState<UsersDialogMode>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<UserEditForm>({
    fullName: "",
    email: "",
    phoneCountryCode: "+506",
    phoneNationalNumber: "",
    address: "",
    roleId: "",
  });
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await usersService.list({
        page,
        limit,
        name: query || undefined,
        status: status || undefined,
        roleId: roleId ? Number(roleId) : undefined,
      });
      setUsers(r.data);
      setTotal(r.total);
    } catch (e) {
      setError(getErrorMessage(e, "No fue posible cargar los usuarios."));
    } finally {
      setLoading(false);
    }
  }, [page, query, status, roleId]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    rolesService
      .listActive()
      .then(setRoles)
      .catch((e) =>
        setError(getErrorMessage(e, "No fue posible cargar los roles.")),
      );
  }, []);
  const open = async (id: number) => {
    setBusy(true);
    try {
      const u = await usersService.get(id);
      setSelected(u);
      setForm({
        fullName: u.fullName,
        email: u.email,
        phoneCountryCode: u.phoneCountryCode ?? "+506",
        phoneNationalNumber: u.phoneNationalNumber ?? "",
        address: u.address ?? "",
        roleId: String(u.roleId),
      });
    } catch (e) {
      notify(getErrorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const run = async () => {
    if (!selected || !mode) return;
    if (mode === "edit") {
      const nextErrors = personContactErrors(form);
      setFieldErrors(nextErrors);
      if (Object.values(nextErrors).some(Boolean)) return;
    }
    setBusy(true);
    try {
      if (mode === "edit")
        await usersService.update(selected.id, {
          fullName: normalizeText(form.fullName),
          email: normalizeEmail(form.email),
          phoneCountryCode: form.phoneNationalNumber
            ? normalizeText(form.phoneCountryCode)
            : undefined,
          phoneNationalNumber: form.phoneNationalNumber.trim() || undefined,
          address: normalizeText(form.address) || undefined,
        });
      if (mode === "role")
        await usersService.changeRole(selected.id, Number(form.roleId));
      if (mode === "activate") await usersService.activate(selected.id);
      if (mode === "deactivate") await usersService.deactivate(selected.id);
      if (mode === "unlock") await usersService.unlock(selected.id);
      notify("Usuario actualizado correctamente.", "success");
      setMode(null);
      const updated = await usersService.get(selected.id);
      setSelected(updated);
      setForm({
        fullName: updated.fullName,
        email: updated.email,
        phoneCountryCode: updated.phoneCountryCode ?? "+506",
        phoneNationalNumber: updated.phoneNationalNumber ?? "",
        address: updated.address ?? "",
        roleId: String(updated.roleId),
      });
      await load();
    } catch (e) {
      notify(getErrorMessage(e), "error");
    } finally {
      setBusy(false);
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
        roles={roles}
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
          <UsersTable users={users} onOpen={(id) => void open(id)} />
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
          onClose={() => setSelected(null)}
          onMode={setMode}
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
          roles={roles}
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

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pagination } from "../../components/Pagination";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { usersService } from "../../services/usersService";
import { rolesService } from "../../services/rolesService";
import type { RoleOption, User, UserStatus } from "../../types/users";
import { getErrorMessage } from "../../utils/errors";
import { useToast } from "../../components/Toast";
import { digitsOnly, normalizeEmail, normalizeText, personContactErrors, phoneNationalMaxLength } from "../../utils/formValidation";
const limit = 10;
const statusLabel = (u: User) =>
  u.isTemporarilyLocked
    ? "Bloqueo temporal"
    : u.isAdministrativelyBlocked
      ? "Bloqueado administrativo"
      : u.status === "ACTIVE"
        ? "Activo"
        : "Inactivo";
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
  const [mode, setMode] = useState<
    "edit" | "role" | "activate" | "deactivate" | "unlock" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
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
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(name.trim());
  };
  return (
    <section>
      <h1>Administración de usuarios</h1>
      <form className="filters card" onSubmit={submit}>
        <label>
          Búsqueda por nombre
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Estado
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as UserStatus | "");
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
          <select
            value={roleId}
            onChange={(e) => {
              setPage(1);
              setRoleId(e.target.value);
            }}
          >
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
          <div
            className="table-wrap"
            tabIndex={0}
            aria-label="Tabla de usuarios, desplazable horizontalmente"
          >
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.role.name}</td>
                    <td>
                      <span
                        className={`badge ${u.isBlocked ? "warning" : u.status === "ACTIVE" ? "success" : "neutral"}`}
                      >
                        {statusLabel(u)}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => void open(u.id)}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onChange={setPage}
          />
        </>
      )}
      {selected && (
        <Modal
          title={`Usuario: ${selected.fullName}`}
          onClose={() => setSelected(null)}
          busy={busy}
        >
          <dl className="detail-grid">
            <div>
              <dt>Identificación</dt>
              <dd>{selected.identification}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{selected.phoneCountryCode && selected.phoneNationalNumber ? `${selected.phoneCountryCode} ${selected.phoneNationalNumber}` : selected.phone || "—"}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{selected.address || "—"}</dd>
            </div>
            <div>
              <dt>Cuenta</dt>
              <dd>
                <span className="badge">{statusLabel(selected)}</span>
              </dd>
            </div>
            <div>
              <dt>Creado</dt>
              <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
          <div className="actions">
            <button onClick={() => setMode("edit")}>Editar datos</button>
            <button onClick={() => setMode("role")}>Cambiar rol</button>
            {selected.status !== "ACTIVE" &&
              !selected.isAdministrativelyBlocked && (
                <button onClick={() => setMode("activate")}>Activar</button>
              )}
            {selected.status !== "INACTIVE" && (
              <button className="danger" onClick={() => setMode("deactivate")}>
                Inactivar
              </button>
            )}
            {selected.isTemporarilyLocked && (
              <button onClick={() => setMode("unlock")}>Desbloquear</button>
            )}
          </div>
        </Modal>
      )}
      {mode === "edit" && (
        <Modal title="Editar usuario" onClose={() => setMode(null)} busy={busy}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
          >
            <label>
              Nombre completo
              <input
                required
                minLength={2}
                maxLength={150}
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              {fieldErrors.fullName && <span className="field-error" role="alert">{fieldErrors.fullName}</span>}
            </label>
            <label>
              Correo electrónico
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}
            </label>
            <label>Código país<input maxLength={5} autoComplete="tel-country-code" value={form.phoneCountryCode} onChange={(e) => setForm({ ...form, phoneCountryCode: e.target.value })} /></label>
            <label>Número<input inputMode="numeric" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.phoneCountryCode)} value={form.phoneNationalNumber} onChange={(e) => setForm({ ...form, phoneNationalNumber: digitsOnly(e.target.value, phoneNationalMaxLength(form.phoneCountryCode)) })} />{fieldErrors.phoneNationalNumber && <span className="field-error" role="alert">{fieldErrors.phoneNationalNumber}</span>}</label>
            <label>
              Dirección
              <input
                maxLength={300}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
            <div className="actions">
              <button type="button" onClick={() => setMode(null)}>
                Cancelar
              </button>
              <button className="primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {mode === "role" && (
        <Modal title="Cambiar rol" onClose={() => setMode(null)} busy={busy}>
          <label>
            Rol
            <select
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="actions">
            <button onClick={() => setMode(null)}>Cancelar</button>
            <button
              className="primary"
              disabled={busy || !form.roleId}
              onClick={() => void run()}
            >
              {busy ? "Guardando…" : "Confirmar cambio"}
            </button>
          </div>
        </Modal>
      )}
      {mode && !["edit", "role"].includes(mode) && (
        <ConfirmDialog
          title="Confirmar acción"
          message={`¿Deseas ${mode === "activate" ? "activar" : mode === "deactivate" ? "inactivar" : "desbloquear"} esta cuenta?`}
          confirmLabel={
            mode === "deactivate" ? "Inactivar cuenta" : "Confirmar"
          }
          danger={mode === "deactivate"}
          busy={busy}
          onClose={() => setMode(null)}
          onConfirm={() => void run()}
        />
      )}
    </section>
  );
}

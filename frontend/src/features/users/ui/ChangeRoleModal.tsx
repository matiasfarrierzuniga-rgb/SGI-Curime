import { Modal } from "@/shared/ui/Modal";
import type { RoleOption } from "../model/users.types";
import type { UserEditForm } from "./EditUserModal";

interface ChangeRoleModalProps {
  form: UserEditForm;
  onFormChange: (form: UserEditForm) => void;
  roles: RoleOption[];
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ChangeRoleModal({
  form,
  onFormChange,
  roles,
  busy,
  onClose,
  onConfirm,
}: ChangeRoleModalProps) {
  return (
    <Modal title="Cambiar rol" onClose={onClose} busy={busy}>
      <label>
        Rol
        <select
          value={form.roleId}
          onChange={(e) => onFormChange({ ...form, roleId: e.target.value })}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <div className="actions">
        <button onClick={onClose}>Cancelar</button>
        <button
          className="primary"
          disabled={busy || !form.roleId}
          onClick={onConfirm}
        >
          {busy ? "Guardando…" : "Confirmar cambio"}
        </button>
      </div>
    </Modal>
  );
}

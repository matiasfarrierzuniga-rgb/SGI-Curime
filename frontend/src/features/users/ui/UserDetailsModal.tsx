import { Modal } from "@/shared/ui/Modal";
import type { User } from "../model/users.types";
import { statusLabel } from "../model/userStatus";

export type UsersDialogMode =
  | "edit"
  | "role"
  | "activate"
  | "deactivate"
  | "unlock"
  | null;

interface UserDetailsModalProps {
  selected: User;
  busy: boolean;
  onClose: () => void;
  onMode: (mode: Exclude<UsersDialogMode, null>) => void;
}

export function UserDetailsModal({
  selected,
  busy,
  onClose,
  onMode,
}: UserDetailsModalProps) {
  return (
    <Modal title={`Usuario: ${selected.fullName}`} onClose={onClose} busy={busy}>
      <dl className="detail-grid">
        <div>
          <dt>Identificación</dt>
          <dd>{selected.identification}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>
            {selected.phoneCountryCode && selected.phoneNationalNumber
              ? `${selected.phoneCountryCode} ${selected.phoneNationalNumber}`
              : selected.phone || "—"}
          </dd>
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
        <button onClick={() => onMode("edit")}>Editar datos</button>
        <button onClick={() => onMode("role")}>Cambiar rol</button>
        {selected.status !== "ACTIVE" && !selected.isAdministrativelyBlocked && (
          <button onClick={() => onMode("activate")}>Activar</button>
        )}
        {selected.status !== "INACTIVE" && (
          <button className="danger" onClick={() => onMode("deactivate")}>
            Inactivar
          </button>
        )}
        {selected.isTemporarilyLocked && (
          <button onClick={() => onMode("unlock")}>Desbloquear</button>
        )}
      </div>
    </Modal>
  );
}

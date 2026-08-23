import { Modal } from "@/shared/ui/Modal";
import { digitsOnly, phoneNationalMaxLength } from "@/shared/lib/formValidation";

export interface UserEditForm {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNationalNumber: string;
  address: string;
  roleId: string;
}

interface EditUserModalProps {
  form: UserEditForm;
  onFormChange: (form: UserEditForm) => void;
  fieldErrors: Record<string, string>;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function EditUserModal({
  form,
  onFormChange,
  fieldErrors,
  busy,
  onClose,
  onSubmit,
}: EditUserModalProps) {
  return (
    <Modal title="Editar usuario" onClose={onClose} busy={busy}>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
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
            onChange={(e) => onFormChange({ ...form, fullName: e.target.value })}
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
            onChange={(e) => onFormChange({ ...form, email: e.target.value })}
          />
          {fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}
        </label>
        <label>Código país<input maxLength={5} autoComplete="tel-country-code" value={form.phoneCountryCode} onChange={(e) => onFormChange({ ...form, phoneCountryCode: e.target.value })} /></label>
        <label>Número<input inputMode="numeric" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.phoneCountryCode)} value={form.phoneNationalNumber} onChange={(e) => onFormChange({ ...form, phoneNationalNumber: digitsOnly(e.target.value, phoneNationalMaxLength(form.phoneCountryCode)) })} />{fieldErrors.phoneNationalNumber && <span className="field-error" role="alert">{fieldErrors.phoneNationalNumber}</span>}</label>
        <label>
          Dirección
          <input
            maxLength={300}
            value={form.address}
            onChange={(e) => onFormChange({ ...form, address: e.target.value })}
          />
        </label>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

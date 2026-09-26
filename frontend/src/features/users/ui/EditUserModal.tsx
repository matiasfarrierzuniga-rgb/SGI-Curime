import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
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
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader><DialogTitle>Editar usuario</DialogTitle><DialogDescription>Actualice únicamente datos de contacto. El rol se gestiona por separado.</DialogDescription></DialogHeader>
      <form
        className="grid gap-4"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <FormField id="user-full-name" label="Nombre completo" required error={fieldErrors.fullName}>
          <Input
            required
            minLength={2}
            maxLength={150}
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => onFormChange({ ...form, fullName: e.target.value })}
          />
        </FormField>
        <FormField id="user-email" label="Correo electrónico" required error={fieldErrors.email}>
          <Input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={form.email}
            onChange={(e) => onFormChange({ ...form, email: e.target.value })}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-[minmax(8rem,0.45fr)_minmax(0,1fr)]">
          <FormField id="user-phone-country" label="Código país">
            <Input maxLength={5} autoComplete="tel-country-code" value={form.phoneCountryCode} onChange={(e) => onFormChange({ ...form, phoneCountryCode: e.target.value })} />
          </FormField>
          <FormField id="user-phone-national" label="Número" error={fieldErrors.phoneNationalNumber}>
            <Input inputMode="numeric" autoComplete="tel-national" maxLength={phoneNationalMaxLength(form.phoneCountryCode)} value={form.phoneNationalNumber} onChange={(e) => onFormChange({ ...form, phoneNationalNumber: digitsOnly(e.target.value, phoneNationalMaxLength(form.phoneCountryCode)) })} />
          </FormField>
        </div>
        <FormField id="user-address" label="Dirección">
          <Input
            maxLength={300}
            value={form.address}
            onChange={(e) => onFormChange({ ...form, address: e.target.value })}
          />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button type="submit" loading={busy}>Guardar cambios</Button>
        </DialogFooter>
      </form>
      </DialogContent>
    </Dialog>
  );
}

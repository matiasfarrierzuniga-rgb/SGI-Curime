import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/FormField";
import { Select } from "@/shared/ui/select";
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
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent size="sm" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Cambiar rol</DialogTitle>
          <DialogDescription>El nuevo rol define los permisos disponibles para esta cuenta.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
        <FormField id="user-role-change" label="Rol">
          <Select
          value={form.roleId}
          onChange={(e) => onFormChange({ ...form, roleId: e.target.value })}
          >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
          </Select>
        </FormField>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button type="button" loading={busy} disabled={!form.roleId} onClick={onConfirm}>Confirmar cambio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import type { User } from "../model/users.types";
import { statusLabel } from "../model/userStatus";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/shared/ui/DataTable";

interface UsersTableProps {
  users: User[];
  onOpen: (personId: number) => void;
}

export function UsersTable({ users, onOpen }: UsersTableProps) {
  return (
    <DataTable
      className="min-w-[980px]"
      scrollLabel="Tabla de usuarios, desplazable horizontalmente"
    >
      <DataTableHeader>
        <DataTableRow className="hover:bg-surface-muted">
          <DataTableHead>Persona</DataTableHead>
          <DataTableHead>Contacto personal</DataTableHead>
          <DataTableHead>Cuenta SGI</DataTableHead>
          <DataTableHead>Rol de cuenta</DataTableHead>
          <DataTableHead>Afiliación</DataTableHead>
          <DataTableHead className="w-28 text-right"><span className="sr-only">Acciones</span></DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
          {users.map((u) => (
            <DataTableRow key={u.id}>
              <DataTableCell className="min-w-48 font-semibold text-text-primary">{u.fullName || "Persona sin nombre registrado"}</DataTableCell>
              <DataTableCell className="min-w-56 break-all text-text-secondary">{u.person.contactEmail || "Sin correo de contacto"}</DataTableCell>
              <DataTableCell>
                {u.access ? <div className="grid gap-1"><Badge variant={u.access.isBlocked ? "warning" : u.access.status === "ACTIVE" ? "success" : "neutral"}>{statusLabel(u.access)}</Badge><span className="break-all text-caption text-text-secondary">{u.access.email}</span></div> : <span className="text-text-secondary">Sin cuenta SGI</span>}
              </DataTableCell>
              <DataTableCell className="whitespace-nowrap">{u.access?.role.name || "Sin rol de cuenta"}</DataTableCell>
              <DataTableCell><Badge variant={u.affiliate?.status === "ACTIVE" ? "success" : "neutral"}>{u.affiliate ? u.affiliate.status === "ACTIVE" ? "Afiliación activa" : "Afiliación inactiva" : "Sin afiliación"}</Badge></DataTableCell>
              <DataTableCell className="text-right">
                <Button variant="outline" size="sm" type="button" onClick={() => onOpen(u.personId)}>Ver detalle</Button>
              </DataTableCell>
            </DataTableRow>
          ))}
      </DataTableBody>
    </DataTable>
  );
}

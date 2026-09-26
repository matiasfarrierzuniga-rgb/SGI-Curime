import type { User } from "../model/users.types";
import { statusLabel } from "../model/userStatus";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/shared/ui/DataTable";

interface UsersTableProps {
  users: User[];
  onOpen: (id: number) => void;
}

export function UsersTable({ users, onOpen }: UsersTableProps) {
  return (
    <DataTable
      className="min-w-[720px]"
      scrollLabel="Tabla de usuarios, desplazable horizontalmente"
    >
      <DataTableHeader>
        <DataTableRow className="hover:bg-surface-muted">
          <DataTableHead>Nombre</DataTableHead>
          <DataTableHead>Correo</DataTableHead>
          <DataTableHead>Rol</DataTableHead>
          <DataTableHead>Estado</DataTableHead>
          <DataTableHead className="w-28 text-right"><span className="sr-only">Acciones</span></DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
          {users.map((u) => (
            <DataTableRow key={u.id}>
              <DataTableCell className="min-w-48 font-semibold text-text-primary">{u.fullName}</DataTableCell>
              <DataTableCell className="min-w-56 break-all text-text-secondary">{u.email}</DataTableCell>
              <DataTableCell className="whitespace-nowrap">{u.role.name}</DataTableCell>
              <DataTableCell>
                <Badge variant={u.isBlocked ? "warning" : u.status === "ACTIVE" ? "success" : "neutral"}>
                  {statusLabel(u)}
                </Badge>
              </DataTableCell>
              <DataTableCell className="text-right">
                <Button variant="outline" size="sm" type="button" onClick={() => onOpen(u.id)}>Ver detalle</Button>
              </DataTableCell>
            </DataTableRow>
          ))}
      </DataTableBody>
    </DataTable>
  );
}

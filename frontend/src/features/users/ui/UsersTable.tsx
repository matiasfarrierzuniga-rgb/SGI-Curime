import type { User } from "../model/users.types";
import { statusLabel } from "../model/userStatus";

interface UsersTableProps {
  users: User[];
  onOpen: (id: number) => void;
}

export function UsersTable({ users, onOpen }: UsersTableProps) {
  return (
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
                <button onClick={() => onOpen(u.id)}>Ver detalle</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

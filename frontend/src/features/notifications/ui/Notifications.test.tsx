import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OperationalNotification } from "../model/notifications.types";

const hooks = vi.hoisted(() => ({
  unread: 2,
  list: [] as OperationalNotification[],
  error: false,
  pending: false,
  refetch: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));

vi.mock("../hooks/useNotifications", () => ({
  useUnreadNotificationCount: () => ({ data: { unread: hooks.unread } }),
  useNotifications: () =>
    hooks.pending
      ? {
          isPending: true,
          isError: false,
          data: undefined,
          refetch: hooks.refetch,
        }
      : hooks.error
        ? {
            isPending: false,
            isError: true,
            error: new Error("Sin conexión"),
            refetch: hooks.refetch,
          }
        : {
            isPending: false,
            isError: false,
            data: {
              data: hooks.list,
              total: hooks.list.length,
              page: 1,
              limit: 20,
            },
            refetch: hooks.refetch,
          },
  useNotificationMutations: () => ({
    markRead: { mutate: hooks.markRead },
    markAllRead: { mutate: hooks.markAllRead, isPending: false },
  }),
}));

import { NotificationCenter } from "./NotificationCenter";
import { NotificationsPage } from "./NotificationsPage";

const notice: OperationalNotification = {
  id: 10,
  type: "USER_REQUEST_SUBMITTED",
  category: "OPERATIONAL",
  priority: "NORMAL",
  title: "Nueva solicitud de cuenta",
  body: "Hay una solicitud de cuenta pendiente de revisión.",
  resourceType: "USER_REQUEST",
  resourceId: "33",
  readAt: null,
  createdAt: "2030-01-01T12:00:00.000Z",
  expiresAt: "2031-01-01T12:00:00.000Z",
  action: { label: "Ver solicitudes de cuenta", href: "/admin/user-requests" },
};

function renderInRouter(node: React.ReactNode) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe("notification inbox UI", () => {
  beforeEach(() => {
    hooks.unread = 2;
    hooks.list = [notice];
    hooks.error = false;
    hooks.pending = false;
    vi.clearAllMocks();
  });

  it("shows unread count, accessible popover, real notification and read action", () => {
    renderInRouter(<NotificationCenter />);
    const trigger = screen.getByRole("button", {
      name: "Notificaciones: 2 no leídas",
    });
    fireEvent.click(trigger);

    expect(
      screen.getByRole("heading", { name: "Notificaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nueva solicitud de cuenta")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Marcar leída" }));
    expect(hooks.markRead).toHaveBeenCalledWith(notice.id);
    expect(screen.getByRole("link", { name: "Abrir" })).toHaveAttribute(
      "href",
      "/admin/user-requests",
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("heading", { name: "Notificaciones" }),
    ).not.toBeInTheDocument();
  });

  it("provides error recovery in popover and empty state in full inbox", () => {
    hooks.error = true;
    renderInRouter(<NotificationCenter />);
    fireEvent.click(
      screen.getByRole("button", { name: "Notificaciones: 2 no leídas" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No fue posible cargar las notificaciones.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(hooks.refetch).toHaveBeenCalledOnce();

    hooks.error = false;
    hooks.list = [];
    renderInRouter(<NotificationsPage />);
    expect(screen.getByText("No hay notificaciones")).toBeInTheDocument();
  });

  it("shows loading states before notifications resolve", () => {
    hooks.pending = true;
    renderInRouter(<NotificationCenter />);
    fireEvent.click(
      screen.getByRole("button", { name: "Notificaciones: 2 no leídas" }),
    );
    expect(screen.getByText("Cargando notificaciones…")).toBeInTheDocument();

    renderInRouter(<NotificationsPage />);
    expect(screen.getByText("Cargando notificaciones...")).toBeInTheDocument();
  });

  it("filters full inbox and allows marking all notifications read", () => {
    renderInRouter(<NotificationsPage />);
    fireEvent.click(screen.getByRole("button", { name: "No leídas" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Marcar todas como leídas" }),
    );
    expect(hooks.markAllRead).toHaveBeenCalledOnce();
  });
});

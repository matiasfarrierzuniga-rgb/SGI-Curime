import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notificationsApi } from "../api/notifications.api";
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationCount,
} from "./useNotifications";

vi.mock("../api/notifications.api", () => ({
  notificationsApi: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("notification queries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches list filters and unread count through TanStack Query", async () => {
    vi.mocked(notificationsApi.list).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    vi.mocked(notificationsApi.unreadCount).mockResolvedValue({ unread: 0 });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = createWrapper(queryClient);
    renderHook(
      () => useNotifications({ filter: "UNREAD", page: 1, limit: 20 }),
      { wrapper },
    );
    renderHook(() => useUnreadNotificationCount(), { wrapper });

    await waitFor(() =>
      expect(notificationsApi.list).toHaveBeenCalledWith({
        filter: "UNREAD",
        page: 1,
        limit: 20,
      }),
    );
    await waitFor(() =>
      expect(notificationsApi.unreadCount).toHaveBeenCalledOnce(),
    );
  });

  it("invalidates list and unread-count queries after read mutations", async () => {
    vi.mocked(notificationsApi.markRead).mockResolvedValue({} as never);
    vi.mocked(notificationsApi.markAllRead).mockResolvedValue({ updated: 1 });
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useNotificationMutations(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.markRead.mutate(4);
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["notifications"],
      }),
    );
    invalidateQueries.mockClear();
    result.current.markAllRead.mutate();
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["notifications"],
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "@/shared/api/httpClient";
import { notificationsApi } from "./notifications.api";

vi.mock("@/shared/api/httpClient", () => ({
  httpClient: { get: vi.fn(), patch: vi.fn() },
}));

describe("notificationsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses notification HTTP contracts for list and unread count", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { data: [], total: 0, page: 2, limit: 20 },
    });
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: { unread: 3 } });

    await expect(
      notificationsApi.list({ filter: "UNREAD", page: 2, limit: 20 }),
    ).resolves.toMatchObject({ total: 0, page: 2 });
    await expect(notificationsApi.unreadCount()).resolves.toEqual({
      unread: 3,
    });
    expect(httpClient.get).toHaveBeenNthCalledWith(1, "/notifications", {
      params: { filter: "UNREAD", page: 2, limit: 20 },
    });
    expect(httpClient.get).toHaveBeenNthCalledWith(
      2,
      "/notifications/unread-count",
    );
  });

  it("uses individual and bulk read HTTP contracts", async () => {
    vi.mocked(httpClient.patch).mockResolvedValueOnce({ data: { id: 12 } });
    vi.mocked(httpClient.patch).mockResolvedValueOnce({ data: { updated: 2 } });

    await expect(notificationsApi.markRead(12)).resolves.toMatchObject({
      id: 12,
    });
    await expect(notificationsApi.markAllRead()).resolves.toEqual({
      updated: 2,
    });
    expect(httpClient.patch).toHaveBeenNthCalledWith(
      1,
      "/notifications/12/read",
    );
    expect(httpClient.patch).toHaveBeenNthCalledWith(
      2,
      "/notifications/read-all",
    );
  });

  it("propagates list errors for query error states", async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error("Sin conexión"));
    await expect(
      notificationsApi.list({ filter: "ALL", page: 1, limit: 5 }),
    ).rejects.toThrow("Sin conexión");
  });
});

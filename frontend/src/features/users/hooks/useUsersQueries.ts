import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesService } from "@/services/rolesService";
import { usersService } from "../api/users.api";
import type { UserUpdate } from "../model/users.types";

export interface UserListFilters {
  page: number;
  limit: number;
  name?: string;
  status?: string;
  roleId?: number;
}

export const usersKeys = {
  all: ["users"] as const,
  list: (filters: UserListFilters) => [...usersKeys.all, "list", filters] as const,
  detail: (id: number) => [...usersKeys.all, "detail", id] as const,
};

export function useUsersList(filters: UserListFilters) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () =>
      usersService.list({
        page: filters.page,
        limit: filters.limit,
        name: filters.name || undefined,
        status: (filters.status || undefined) as never,
        roleId: filters.roleId || undefined,
      }),
  });
}

export function useRolesOptions() {
  return useQuery({
    queryKey: ["roles", "active"],
    queryFn: () => rolesService.listActive(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserDetail(id: number | null) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? 0),
    queryFn: () => usersService.get(id!),
    enabled: id !== null,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = async (id?: number) => {
    await queryClient.invalidateQueries({ queryKey: usersKeys.all });
    if (id !== undefined)
      await queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
  };
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdate }) =>
      usersService.update(id, payload),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
  const changeRole = useMutation({
    mutationFn: ({ id, roleId }: { id: number; roleId: number }) =>
      usersService.changeRole(id, roleId),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
  const activate = useMutation({
    mutationFn: (id: number) => usersService.activate(id),
    onSuccess: (_data, id) => invalidate(id),
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => usersService.deactivate(id),
    onSuccess: (_data, id) => invalidate(id),
  });
  const unlock = useMutation({
    mutationFn: (id: number) => usersService.unlock(id),
    onSuccess: (_data, id) => invalidate(id),
  });
  return { update, changeRole, activate, deactivate, unlock };
}

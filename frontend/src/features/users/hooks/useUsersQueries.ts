import { useQuery } from "@tanstack/react-query";
import { rolesService } from "@/features/roles";
import { usersService } from "../api/users.api";

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
  detail: (personId: number) => [...usersKeys.all, "detail", personId] as const,
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

export function useUserDetail(personId: number | null) {
  return useQuery({
    queryKey: usersKeys.detail(personId ?? 0),
    queryFn: () => usersService.get(personId!),
    enabled: personId !== null,
  });
}

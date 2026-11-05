export interface DockerInspection {
  Config?: { Labels?: Record<string, string> };
  Mounts?: unknown[];
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostIp: string; HostPort: string }> | null>;
  };
  HostConfig?: { Tmpfs?: Record<string, string> };
}

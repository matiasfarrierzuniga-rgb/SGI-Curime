const apiUrl = import.meta.env.VITE_API_URL?.trim()

if (!apiUrl) {
  console.warn('VITE_API_URL no está definida; se usará una URL relativa.')
}

export const env = { apiUrl: apiUrl || '/' } as const

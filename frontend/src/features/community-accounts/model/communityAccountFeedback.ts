import axios from 'axios'

export type CommunityFeedbackKind = 'error' | 'warning'
export type CommunityFeedbackField = 'email' | 'password' | 'passwordConfirmation' | 'privacyAcknowledgement'
export type CommunityFeedbackAction = 'register' | 'verify' | 'resend' | 'login'

export interface CommunityFeedback {
  kind: CommunityFeedbackKind
  message: string
  field?: CommunityFeedbackField
}

export const communityFeedbackMessages = {
  registrationAccepted: 'Solicitud recibida. Revisá tu correo para continuar con la verificación',
  verificationSucceeded: '¡Correo verificado! Ya podés iniciar sesión',
  resendAccepted: 'Solicitud recibida. Si corresponde, recibirás un nuevo enlace',
  passwordUppercase: 'La contraseña debe incluir al menos una letra mayúscula',
  passwordConfirmation: 'Las contraseñas no coinciden',
  tokenExpired: 'El enlace venció. Solicitá uno nuevo para continuar',
  tokenUnavailable: 'Este enlace ya no es válido. Podés solicitar uno nuevo',
  throttled: 'Realizaste demasiados intentos. Esperá unos minutos antes de continuar',
  network: 'No pudimos conectar con el servidor. Comprobá tu conexión',
  unavailable: 'El servicio no está disponible temporalmente. Intentá nuevamente más tarde',
  invalidCredentials: 'No fue posible iniciar sesión. Verifique sus credenciales.',
} as const

export function communityPasswordError(password: string) {
  if (password.length < 10) return 'Use al menos 10 caracteres.'
  if (!/[A-Z]/.test(password)) return communityFeedbackMessages.passwordUppercase
  if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una letra minúscula.'
  if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número.'
  return ''
}

export function communityAccountFeedback(error: unknown, action: CommunityFeedbackAction): CommunityFeedback {
  if (!axios.isAxiosError(error)) {
    return { kind: 'error', message: action === 'login' ? communityFeedbackMessages.invalidCredentials : communityFeedbackMessages.unavailable }
  }
  if (!error.response) return { kind: 'error', message: communityFeedbackMessages.network }

  const status = error.response.status
  const message = responseMessage(error.response.data)
  if (status === 429) return { kind: 'warning', message: communityFeedbackMessages.throttled }
  if (status >= 500) return { kind: 'error', message: communityFeedbackMessages.unavailable }
  if (action === 'login' && status === 401) return { kind: 'error', message: communityFeedbackMessages.invalidCredentials }

  if (action === 'verify') {
    if (message === 'El enlace de verificación venció.') {
      return { kind: 'warning', message: communityFeedbackMessages.tokenExpired }
    }
    if (status === 409 || status === 400) {
      return { kind: 'warning', message: communityFeedbackMessages.tokenUnavailable }
    }
  }

  if (status === 400 && action === 'register') {
    if (message.includes('uppercase letter')) {
      return { kind: 'error', field: 'password', message: communityFeedbackMessages.passwordUppercase }
    }
    if (message.includes('lowercase letter')) {
      return { kind: 'error', field: 'password', message: 'La contraseña debe incluir al menos una letra minúscula.' }
    }
    if (message.includes('contain a number')) {
      return { kind: 'error', field: 'password', message: 'La contraseña debe incluir al menos un número.' }
    }
    if (message === 'Las contraseñas no coinciden.') {
      return { kind: 'error', field: 'passwordConfirmation', message }
    }
    if (message.includes('email')) {
      return { kind: 'error', field: 'email', message: 'Ingrese un correo electrónico válido.' }
    }
  }

  return { kind: 'error', message: communityFeedbackMessages.unavailable }
}

function responseMessage(data: unknown) {
  if (!data || typeof data !== 'object' || !('message' in data)) return ''
  const message = (data as { message?: unknown }).message
  return Array.isArray(message) ? String(message[0] ?? '') : typeof message === 'string' ? message : ''
}

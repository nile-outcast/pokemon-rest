import type { ApiCallErrorResponse } from '../types/api-call'

export function toErrorMessage(response: ApiCallErrorResponse<Error>): string {
  const { data, rawError } = response

  if (data) {
    return data.message
  }

  if (rawError) {
    if (typeof rawError === 'string') {
      return rawError
    }

    if (rawError instanceof Error) {
      return rawError.message
    }
  }

  return 'Неизвестная ошибка'
}

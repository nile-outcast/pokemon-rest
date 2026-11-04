import type { BaseObject } from 'typescript-extended-types'

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiCallConfig = Partial<{
  method: ApiMethod
  baseUrl: string
  headers: BaseObject
}>

export type ApiCallArgs<Body extends BaseObject | FormData> = Partial<{
  query: BaseObject
  body: Body
}>

export interface ApiCallSuccessResponse<D> {
  isError: false
  data: D
  isCancelled?: never
}

export interface ApiCallErrorResponse<E extends Error> {
  isError: true
  data?: E
  isCancelled?: never
  rawError?: unknown
}

export interface ApiCallCancelledResponse {
  isError: true
  isCancelled: true
  rawError?: unknown
}

export type ApiCallResponse<D, E extends Error = Error> =
  ApiCallSuccessResponse<D> | ApiCallErrorResponse<E> | ApiCallCancelledResponse

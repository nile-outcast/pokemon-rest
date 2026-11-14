import type { StoreApi } from 'zustand'

export type SetState<Store> = StoreApi<Store>['setState']
export type GetState<Store> = StoreApi<Store>['getState']

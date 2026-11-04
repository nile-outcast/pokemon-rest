/**
 * Статус загрузки данных.
 * Начальное состояние — 'initial' (запрос ещё ни разу не выполнялся).
 */
export type FetchStatus = 'initial' | 'loading' | 'success' | 'error'

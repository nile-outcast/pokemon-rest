import { Button } from '../button/Button'

import './LoadStatus.css'

type LoadStatusProps = {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  loadMessage: string
  errorMessage: string
  emptyMessage: string
  retry?: VoidFunction
}

export function LoadStatus({
  isLoading,
  isError,
  isEmpty,
  loadMessage,
  errorMessage,
  emptyMessage,
  retry,
}: LoadStatusProps) {
  if (isLoading) {
    return <p className="load-status__status">{loadMessage}</p>
  }

  if (isError) {
    return (
      <div className="load-status__error">
        <p>{errorMessage}</p>
        {retry && <Button onClick={retry}>Повторить</Button>}
      </div>
    )
  }

  if (isEmpty) {
    return <p className="load-status__status">{emptyMessage}</p>
  }

  return null
}

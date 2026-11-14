import { Dialog } from '@base-ui/react/dialog'
import type { PokemonListItem } from '@pokemon-rest/shared'
import { isDefined } from 'typescript-extended-types'

import { PokemonDetail } from '@/features/pokemon-detail/ui/PokemonDetail'

import './PokemonDetailModal.css'

type PokemonDetailModalProps = {
  handle: ReturnType<typeof Dialog.createHandle<PokemonListItem>>
}

export function PokemonDetailModal({ handle }: PokemonDetailModalProps) {
  return (
    <Dialog.Root handle={handle}>
      {({ payload }) => (
        <Dialog.Portal>
          <Dialog.Backdrop className="pokemon-detail__backdrop" />
          <Dialog.Popup className="pokemon-detail__popup">
            <Dialog.Close
              className="pokemon-detail__close"
              aria-label="Закрыть"
            >
              ×
            </Dialog.Close>
            {isDefined(payload) && <PokemonDetail pokemonItem={payload} />}
          </Dialog.Popup>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  )
}

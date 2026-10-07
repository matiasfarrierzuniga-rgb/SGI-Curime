import { Button } from '@/shared/ui/button'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { conditionLabels, itemStatusLabels } from '../model/inventoryItemLabels'
import type { InventoryItem } from '../model/inventoryItem.types'

type InventoryItemsListProps = {
  items: InventoryItem[]
  onOpen: (itemId: number) => void
  onMovement: (item: InventoryItem, kind: 'entry' | 'exit') => void
}

function stockVariant(item: InventoryItem) {
  return item.status === 'INACTIVE' ||
    item.currentQuantity === 0 ||
    item.currentQuantity <= item.minimumQuantity
    ? 'warning'
    : 'success'
}

export function InventoryItemsList({
  items,
  onOpen,
  onMovement,
}: InventoryItemsListProps) {
  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            className="min-w-0 rounded-surface border border-border-default bg-surface-card p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-caption font-semibold uppercase tracking-wide text-text-secondary">
                  Código {item.code}
                </p>
                <h2 className="mt-1 break-words text-heading-3 font-semibold text-text-primary">
                  {item.name}
                </h2>
                {item.description ? (
                  <p className="mt-1 break-words text-body-small text-text-secondary">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <StatusBadge
                variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}
              >
                {itemStatusLabels[item.status]}
              </StatusBadge>
            </div>

            <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-body-small">
              <div className="min-w-0">
                <dt className="font-semibold text-text-secondary">Categoría</dt>
                <dd className="mt-0.5 break-words text-text-primary">
                  {item.category.name}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-text-secondary">Existencia</dt>
                <dd className="mt-0.5 text-text-primary">
                  <StatusBadge variant={stockVariant(item)}>
                    {item.currentQuantity} {item.unit}
                  </StatusBadge>
                  <span className="mt-1 block text-caption text-text-secondary">
                    Mínimo: {item.minimumQuantity} {item.unit}
                  </span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-text-secondary">Ubicación</dt>
                <dd className="mt-0.5 break-words text-text-primary">
                  {item.location || 'Sin ubicación registrada'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-semibold text-text-secondary">Condición</dt>
                <dd className="mt-0.5 text-text-primary">
                  {conditionLabels[item.condition]}
                </dd>
              </div>
            </dl>

            <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border-subtle pt-3 sm:grid-cols-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                aria-label={`Ver detalle de ${item.name}`}
                onClick={() => onOpen(item.id)}
              >
                Ver detalle
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onMovement(item, 'entry')}
              >
                Entrada
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onMovement(item, 'exit')}
              >
                Salida
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div
        className="hidden overflow-x-auto rounded-surface border border-border-default lg:block"
        tabIndex={0}
        aria-label="Tabla de artículos del inventario, desplazable horizontalmente"
      >
        <table className="w-full min-w-[900px] table-fixed text-left text-body-small">
          <caption className="sr-only">
            Bienes registrados en el inventario
          </caption>
          <thead className="bg-surface-muted text-text-secondary">
            <tr>
              <th scope="col" className="w-32 px-4 py-3 font-semibold">
                Código
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Bien
              </th>
              <th scope="col" className="w-40 px-4 py-3 font-semibold">
                Categoría
              </th>
              <th scope="col" className="w-36 px-4 py-3 font-semibold">
                Existencia
              </th>
              <th scope="col" className="w-36 px-4 py-3 font-semibold">
                Ubicación
              </th>
              <th scope="col" className="w-28 px-4 py-3 font-semibold">
                Estado
              </th>
              <th scope="col" className="w-32 px-4 py-3 font-semibold">
                Condición
              </th>
              <th scope="col" className="w-64 px-4 py-3 text-right font-semibold">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-surface-card text-text-primary">
            {items.map((item) => (
              <tr
                key={item.id}
                className="align-middle transition-colors hover:bg-surface-muted/50"
              >
                <td className="break-words px-4 py-3 font-semibold">
                  {item.code}
                </td>
                <td className="px-4 py-3">
                  <p className="break-words font-semibold">{item.name}</p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 break-words text-caption text-text-secondary">
                      {item.description}
                    </p>
                  ) : null}
                </td>
                <td className="break-words px-4 py-3">{item.category.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge variant={stockVariant(item)}>
                    {item.currentQuantity} {item.unit}
                  </StatusBadge>
                  <span className="mt-1 block text-caption text-text-secondary">
                    Mínimo: {item.minimumQuantity} {item.unit}
                  </span>
                </td>
                <td className="break-words px-4 py-3">
                  {item.location || '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}
                  >
                    {itemStatusLabels[item.status]}
                  </StatusBadge>
                </td>
                <td className="break-words px-4 py-3">
                  {conditionLabels[item.condition]}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Ver detalle de ${item.name}`}
                      onClick={() => onOpen(item.id)}
                    >
                      Ver detalle
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Registrar entrada de ${item.name}`}
                      onClick={() => onMovement(item, 'entry')}
                    >
                      Entrada
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Registrar salida de ${item.name}`}
                      onClick={() => onMovement(item, 'exit')}
                    >
                      Salida
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

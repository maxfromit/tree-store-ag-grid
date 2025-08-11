import { isNil } from 'lodash'
export interface Item {
  id: number | string
  parentId: number | string | null
  label: string
}

export type ItemId = Item['id']

type ItemIdSet = Set<ItemId>
type ChildrenMap = Map<ItemId, ItemIdSet>
type ItemMap = Map<ItemId, Item>

export class TreeStore {
  private itemsMap: ItemMap
  private childrenMap: ChildrenMap

  constructor(items: Item[]) {
    this.validateNoCycles(items)
    this.itemsMap = new Map()
    this.childrenMap = new Map()
    this.initializeItemAndChildrenMaps(items)
  }

  private hasCycle(startId: ItemId, getParent: (id: ItemId) => ItemId | null) {
    const visited = new Set<ItemId>()
    let currentId: ItemId | null = startId

    while (currentId !== null) {
      if (visited.has(currentId)) return true
      visited.add(currentId)
      currentId = getParent(currentId)
    }
    return false
  }

  private validateNoCycles(items: Item[]): void {
    const idWithParentId = new Map<ItemId, ItemId | null>()
    items.forEach((item) => idWithParentId.set(item.id, item.parentId))

    const getParent = (id: ItemId) => idWithParentId.get(id) ?? null

    for (const item of items) {
      if (this.hasCycle(item.id, getParent)) {
        throw new Error(`Data Integrity Error: Cycle detected starting at item with id ${item.id}`)
      }
    }
  }

  private initializeItemAndChildrenMaps(items: Item[]) {
    items.forEach((item) => {
      if (this.itemsMap.has(item.id)) {
        throw new Error(`Item with id ${item.id} already exists`)
      }
      this.itemsMap.set(item.id, { ...item })

      if (item.parentId !== null) {
        if (this.childrenMap.has(item.parentId)) {
          return this.childrenMap.get(item.parentId)?.add(item.id)
        }
        return this.childrenMap.set(item.parentId, new Set([item.id]))
      }
    })
  }

  private getChildrenIdsSet(parentId: ItemId): Set<ItemId> {
    return this.childrenMap.get(parentId) ?? new Set()
  }

  private findItemsByIdsFromSet(itemIdSet: ItemIdSet): Item[] {
    const findedItems: Item[] = []

    if (itemIdSet.size === 0) {
      return findedItems
    }

    itemIdSet.forEach((id) => {
      if (this.itemsMap.has(id)) {
        const item = this.itemsMap.get(id)
        if (item) {
          findedItems.push({ ...item })
        }
      }
    })

    return findedItems
  }

  private collectChildrenRecursive(
    currentId: ItemId,
    result?: ItemIdSet,
    visited?: Set<ItemId>,
  ): ItemIdSet {
    const currentResult = result ?? new Set<ItemId>()
    const alreadyVisited = visited ?? new Set<ItemId>()
    alreadyVisited.add(currentId)

    const currentChildrenIdsSet = this.getChildrenIdsSet(currentId)

    let unionResult = currentResult.union(currentChildrenIdsSet)

    for (const nextChildId of currentChildrenIdsSet) {
      if (!alreadyVisited.has(nextChildId)) {
        unionResult = this.collectChildrenRecursive(nextChildId, unionResult, alreadyVisited)
      }
    }
    return unionResult
  }

  private collectChildAndItsParentRecursive(currentId: ItemId, result?: Item[]): Item[] {
    const currentResult = result ?? []

    const currentItem = this.getItem(currentId)
    if (currentItem) {
      currentResult.push(currentItem)
    }

    const parentId = currentItem?.parentId
    if (!isNil(parentId)) {
      this.collectChildAndItsParentRecursive(parentId, currentResult)
    }

    return currentResult
  }

  private updateParent(
    childId: ItemId,
    parentId: ItemId | null,
    oldParentId?: ItemId | null,
  ): void {
    // Only check for cycles when updating an item's parent (not on add).
    // A new item cannot create a cycle, but updating parent could.
    // If moving from root (oldParentId === null) to a new parent, ensure new parent is not a descendant.
    if (oldParentId !== undefined && !isNil(parentId)) {
      const childrenOfChildId = this.collectChildrenRecursive(childId)
      if (childrenOfChildId.has(parentId)) {
        throw new Error(
          `Data Integrity Error: Cannot set parent ${parentId} for child ${childId} because it creates a cycle.`,
        )
      }
    }

    if (!isNil(parentId)) {
      if (!this.childrenMap.has(parentId)) {
        this.childrenMap.set(parentId, new Set([childId]))
      }

      this.childrenMap.get(parentId)?.add(childId)
    }

    if (!!oldParentId) {
      this.childrenMap.get(oldParentId)?.delete(childId)
    }
  }

  getAll(): Item[] {
    return Array.from(this.itemsMap.values(), (it) => ({ ...it }))
  }

  getItem(id: ItemId) {
    const item = this.itemsMap.get(id)
    return item ? { ...item } : undefined
  }

  getChildren(parentId: ItemId) {
    const childrenIdsSet = this.getChildrenIdsSet(parentId)
    return this.findItemsByIdsFromSet(childrenIdsSet)
  }

  getAllChildren(parentId: ItemId) {
    const childrenIdsSet = this.collectChildrenRecursive(parentId)
    return this.findItemsByIdsFromSet(childrenIdsSet)
  }

  getAllParents(parentId: ItemId) {
    return this.collectChildAndItsParentRecursive(parentId)
  }

  addItem(item: Item): void {
    if (this.itemsMap.has(item.id)) {
      throw new Error(`Item with id ${item.id} already exists`)
    }
    const newItem = { ...item }
    this.itemsMap.set(newItem.id, newItem)

    this.updateParent(newItem.id, newItem.parentId)
  }

  removeItem(id: ItemId): void {
    const item = this.getItem(id)
    if (!item) throw new Error(`Item with id ${id} not found`)

    const allChildrenIdToRemove = this.collectChildrenRecursive(id)
    const idsToRemove = [id, ...allChildrenIdToRemove]

    idsToRemove.forEach((childId) => {
      const original = this.itemsMap.get(childId)
      if (original && !isNil(original.parentId)) {
        this.childrenMap.get(original.parentId)?.delete(childId)
      }
      this.itemsMap.delete(childId)
      this.childrenMap.delete(childId)
    })
  }

  updateItem(item: Item): void {
    const existingItem = this.itemsMap.get(item.id)
    if (!existingItem) return
    this.itemsMap.set(item.id, { ...item })

    const oldParentId = existingItem.parentId
    const newParentId = item.parentId

    if (oldParentId !== newParentId) {
      this.updateParent(existingItem.id, newParentId, oldParentId)
    }
  }
}

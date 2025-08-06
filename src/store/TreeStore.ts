interface Item {
  id: number | string
  parent: number | string | null
  [key: string]: unknown
}

type ItemId = Item['id']
type ItemIdSet = Set<ItemId>
type ChildrenMap = Map<ItemId, ItemIdSet>
type itemMap = Map<ItemId, Item>

export class TreeStore {
  private itemsMap: itemMap
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
    const idToParent = new Map<ItemId, ItemId | null>()
    items.forEach((item) => idToParent.set(item.id, item.parent))

    const getParent = (id: ItemId) => idToParent.get(id) ?? null

    for (const item of items) {
      if (this.hasCycle(item.id, getParent)) {
        throw new Error(`Data Integrity Error: Cycle detected starting at item with id ${item.id}`)
      }
    }
  }

  private initializeItemAndChildrenMaps(items: Item[]) {
    items.forEach((item) => {
      this.itemsMap.set(item.id, { ...item })

      if (item.parent !== null) {
        if (this.childrenMap.has(item.parent)) {
          return this.childrenMap.get(item.parent)?.add(item.id)
        }
        return this.childrenMap.set(item.parent, new Set([item.id]))
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
          findedItems.push(item)
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

    const parentId = currentItem?.parent
    if (parentId) {
      this.collectChildAndItsParentRecursive(parentId, currentResult)
    }

    return currentResult
  }

  private updateParent(
    childId: ItemId,
    parentId: ItemId | null,
    oldParentId?: ItemId | null,
  ): void {
    if (!!parentId) {
      this.collectChildrenRecursive(parentId)

      if (!this.childrenMap.has(parentId)) {
        this.childrenMap.set(parentId, new Set([childId]))
      }

      this.childrenMap.get(parentId)?.add(childId)
    }

    if (oldParentId !== undefined && parentId) {
      const childrenOfChildId = this.collectChildrenRecursive(childId)
      if (childrenOfChildId.has(parentId)) {
        throw new Error(
          `Data Integrity Error: Cannot set parent ${parentId} for child ${childId} because it creates a cycle.`,
        )
      }
    }

    if (!!oldParentId) {
      this.childrenMap.get(oldParentId)?.delete(childId)
    }
    return console.log(`Parent data of Item with id ${childId} updated, `)
  }

  getAllChildrenMap(): ChildrenMap {
    return this.childrenMap
  }

  getAll(): Item[] {
    return Array.from(this.itemsMap.values())
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

    this.updateParent(newItem.id, newItem.parent)
  }

  removeItem(id: ItemId): void {
    const item = this.getItem(id)
    if (!item) return console.log(`Item with id ${id} not found`)

    const allChildrenIdToRemove = this.collectChildrenRecursive(id)
    const idsToRemove = [id, ...allChildrenIdToRemove]
    idsToRemove.map((childId) => {
      this.itemsMap.delete(childId)
      this.childrenMap.delete(childId)
    })
    return console.log(`Item with id ${id} and its children removed`)
  }

  updateItem(item: Item): void {
    const existingItem = this.itemsMap.get(item.id)
    if (!existingItem) return
    this.itemsMap.set(item.id, { ...item })

    const oldParent = existingItem.parent
    const newParent = item.parent

    if (oldParent !== newParent) {
      this.updateParent(existingItem.id, newParent, oldParent)
    }
  }
}

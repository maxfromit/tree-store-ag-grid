interface Item {
  id: number | string
  parent: number | string | null
  [key: string]: unknown
}

export class TreeStore {
  private items: Map<number | string, Item>
  private childrenMap: Map<number | string, Set<number | string>>
  private originalItems: Item[]

  constructor(items: Item[]) {
    this.items = new Map()
    this.childrenMap = new Map()
    this.originalItems = items.map((item) => ({ ...item }))

    this.buildInternalStructures(items)
  }

  private buildInternalStructures(items: Item[]): void {
    for (const item of items) {
      this.items.set(item.id, { ...item })

      if (item.parent !== null) {
        if (!this.childrenMap.has(item.parent)) {
          this.childrenMap.set(item.parent, new Set())
        }
        this.childrenMap.get(item.parent)!.add(item.id)
      }
    }
  }

  getAll(): Item[] {
    return this.originalItems.map((item) => ({ ...item }))
  }

  getAllChildrenMap(): Map<number | string, Set<number | string>> {
    return this.childrenMap
  }

  getItem(id: number | string): Item | undefined {
    const item = this.items.get(id)
    return item ? { ...item } : undefined
  }

  getChildren(id: number | string): Item[] {
    const childrenIds = this.childrenMap.get(id)
    if (!childrenIds) {
      return []
    }

    return Array.from(childrenIds)
      .map((childId) => this.items.get(childId))
      .filter((item): item is Item => item !== undefined)
      .map((item) => ({ ...item }))
  }

  getAllChildren(id: number | string): Item[] {
    const result: Item[] = []
    const visited = new Set<number | string>()

    const collectChildren = (parentId: number | string): void => {
      if (visited.has(parentId)) return
      visited.add(parentId)

      const childrenIds = this.childrenMap.get(parentId)
      if (!childrenIds) return

      for (const childId of childrenIds) {
        const child = this.items.get(childId)
        if (child) {
          result.push({ ...child })
          collectChildren(childId)
        }
      }
    }

    collectChildren(id)
    return result
  }

  getAllParents(id: number | string): Item[] {
    const result: Item[] = []
    let currentId: number | string | null = id

    while (currentId !== null) {
      const item = this.items.get(currentId)
      if (!item) break

      result.push({ ...item })
      currentId = item.parent
    }

    return result
  }

  addItem(item: Item): void {
    const newItem = { ...item }
    this.items.set(newItem.id, newItem)
    this.originalItems.push(newItem)

    if (newItem.parent !== null) {
      if (!this.childrenMap.has(newItem.parent)) {
        this.childrenMap.set(newItem.parent, new Set())
      }
      this.childrenMap.get(newItem.parent)!.add(newItem.id)
    }
  }

  removeItem(id: number | string): void {
    const item = this.items.get(id)
    if (!item) return

    const allChildrenToRemove = this.getAllChildren(id)

    for (const child of allChildrenToRemove) {
      this.items.delete(child.id)
      this.childrenMap.delete(child.id)

      if (child.parent !== null) {
        const parentChildren = this.childrenMap.get(child.parent)
        if (parentChildren) {
          parentChildren.delete(child.id)
          if (parentChildren.size === 0) {
            this.childrenMap.delete(child.parent)
          }
        }
      }
    }

    this.items.delete(id)
    this.childrenMap.delete(id)

    if (item.parent !== null) {
      const parentChildren = this.childrenMap.get(item.parent)
      if (parentChildren) {
        parentChildren.delete(id)
        if (parentChildren.size === 0) {
          this.childrenMap.delete(item.parent)
        }
      }
    }

    this.originalItems = this.originalItems.filter(
      (originalItem) =>
        originalItem.id !== id &&
        !allChildrenToRemove.some((child) => child.id === originalItem.id),
    )
  }

  updateItem(item: Item): void {
    const existingItem = this.items.get(item.id)
    if (!existingItem) return

    const oldParent = existingItem.parent
    const newParent = item.parent

    if (oldParent !== newParent) {
      if (oldParent !== null) {
        const oldParentChildren = this.childrenMap.get(oldParent)
        if (oldParentChildren) {
          oldParentChildren.delete(item.id)
          if (oldParentChildren.size === 0) {
            this.childrenMap.delete(oldParent)
          }
        }
      }

      if (newParent !== null) {
        if (!this.childrenMap.has(newParent)) {
          this.childrenMap.set(newParent, new Set())
        }
        this.childrenMap.get(newParent)!.add(item.id)
      }
    }

    this.items.set(item.id, { ...item })

    const originalIndex = this.originalItems.findIndex((original) => original.id === item.id)
    if (originalIndex !== -1) {
      this.originalItems[originalIndex] = { ...item }
    }
  }
}

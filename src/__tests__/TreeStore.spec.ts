import { describe, it, expect, beforeEach } from 'vitest'
import { TreeStore } from '@/store/TreeStore'
import { items } from '@/constants/items'

interface Item {
  id: number | string
  parent: number | string | null
  [key: string]: unknown
}

describe('TreeStore', () => {
  let treeStore: TreeStore

  beforeEach(() => {
    treeStore = new TreeStore(items)
  })

  describe('constructor', () => {
    it('should initialize TreeStore with items', () => {
      const store = new TreeStore(items)
      expect(store).toBeInstanceOf(TreeStore)
    })

    it('should handle empty array', () => {
      const store = new TreeStore([])
      expect(store.getAll()).toEqual([])
    })
  })

  describe('getAll', () => {
    it('should return all items in original order', () => {
      const result = treeStore.getAll()
      expect(result).toEqual(items)
    })

    it('should return a copy of items (not reference)', () => {
      const result = treeStore.getAll()
      expect(result).not.toBe(items)
      expect(result[0]).not.toBe(items[0])
    })

    it('should return new copies on each call', () => {
      const first = treeStore.getAll()
      const second = treeStore.getAll()
      expect(first[0]).not.toBe(second[0])
    })
  })

  describe('getItem', () => {
    it('should return item by id', () => {
      const result = treeStore.getItem(1)
      expect(result).toEqual({ id: 1, parent: null, label: 'Айтем 1' })
    })

    it('should return item by string id', () => {
      const result = treeStore.getItem('2')
      expect(result).toEqual({ id: '2', parent: 1, label: 'Айтем 2' })
    })

    it('should return undefined for non-existent id', () => {
      const result = treeStore.getItem(999)
      expect(result).toBeUndefined()
    })

    it('should return a copy of item (not reference)', () => {
      const result = treeStore.getItem(1)
      const original = items.find((item) => item.id === 1)
      expect(result).not.toBe(original)
    })
  })

  describe('getChildren', () => {
    it('should return direct children', () => {
      const result = treeStore.getChildren(1)
      expect(result).toHaveLength(2)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining(['2', 3]))
    })

    it('should return direct children for string id', () => {
      const result = treeStore.getChildren('2')
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining([4, 5, 6]))
    })

    it('should return new copies on each call', () => {
      const first = treeStore.getChildren(1)
      const second = treeStore.getChildren(1)
      expect(first[0]).not.toBe(second[0])
    })

    it('should return empty array if no children', () => {
      const result = treeStore.getChildren(7)
      expect(result).toEqual([])
    })

    it('should return empty array for non-existent id', () => {
      const result = treeStore.getChildren(999)
      expect(result).toEqual([])
    })
  })

  describe('getAllChildren', () => {
    it('should return all children recursively', () => {
      const result = treeStore.getAllChildren(1)
      expect(result).toHaveLength(7)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining(['2', 3, 4, 5, 6, 7, 8]))
    })

    it('should return all children for intermediate node', () => {
      const result = treeStore.getAllChildren('2')
      expect(result).toHaveLength(5)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining([4, 5, 6, 7, 8]))
    })

    it('should return empty array if no children', () => {
      const result = treeStore.getAllChildren(7)
      expect(result).toEqual([])
    })

    it('should return empty array for non-existent id', () => {
      const result = treeStore.getAllChildren(999)
      expect(result).toEqual([])
    })
  })

  describe('getAllParents', () => {
    it('should return all parents including self', () => {
      const result = treeStore.getAllParents(7)
      expect(result).toHaveLength(4)
      expect(result.map((item) => item.id)).toEqual([7, 4, '2', 1])
    })

    it('should return only self for root element', () => {
      const result = treeStore.getAllParents(1)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it('should return correct order for intermediate element', () => {
      const result = treeStore.getAllParents(4)
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual([4, '2', 1])
    })

    it('should return empty array for non-existent id', () => {
      const result = treeStore.getAllParents(999)
      expect(result).toEqual([])
    })
  })

  describe('addItem', () => {
    it('should add new item', () => {
      const newItem = { id: 9, parent: 3, label: 'Айтем 9' }
      treeStore.addItem(newItem)

      expect(treeStore.getItem(9)).toEqual(newItem)
      expect(treeStore.getChildren(3)).toContainEqual(newItem)
      expect(treeStore.getAll()).toHaveLength(9)
    })

    it('should add root item', () => {
      const newItem = { id: 10, parent: null, label: 'Айтем 10' }
      treeStore.addItem(newItem)

      expect(treeStore.getItem(10)).toEqual(newItem)
      expect(treeStore.getAll()).toHaveLength(9)
    })

    it('should not affect original item reference', () => {
      const newItem = { id: 9, parent: 3, label: 'Айтем 9' }
      treeStore.addItem(newItem)

      newItem.label = 'Modified'
      expect(treeStore.getItem(9)?.label).toBe('Айтем 9')
    })
  })

  describe('removeItem', () => {
    it('should remove item and all its children', () => {
      treeStore.removeItem('2')

      expect(treeStore.getItem('2')).toBeUndefined()
      expect(treeStore.getItem(4)).toBeUndefined()
      expect(treeStore.getItem(5)).toBeUndefined()
      expect(treeStore.getItem(6)).toBeUndefined()
      expect(treeStore.getItem(7)).toBeUndefined()
      expect(treeStore.getItem(8)).toBeUndefined()

      expect(treeStore.getAll()).toHaveLength(2)
      expect(treeStore.getChildren(1)).toHaveLength(1)
      expect(treeStore.getChildren(1)[0].id).toBe(3)
    })

    it('should remove leaf item', () => {
      treeStore.removeItem(7)

      expect(treeStore.getItem(7)).toBeUndefined()
      expect(treeStore.getAll()).toHaveLength(7)
      expect(treeStore.getChildren(4)).toHaveLength(1)
    })

    it('should handle non-existent item', () => {
      const originalLength = treeStore.getAll().length

      expect(() => treeStore.removeItem(999)).toThrow()
      expect(treeStore.getAll()).toHaveLength(originalLength)
    })

    it('should remove child id from parent children set', () => {
      treeStore.removeItem(3)
      // After removal, parent 1 should not have 3 in its children set
      const childrenSet = treeStore['childrenMap'].get(1)
      expect(childrenSet?.has(3)).toBe(false)
    })
  })

  describe('updateItem', () => {
    it('should update item properties', () => {
      const updatedItem = { id: 1, parent: null, label: 'Updated Айтем 1', newField: 'test' }
      treeStore.updateItem(updatedItem)

      const result = treeStore.getItem(1)
      expect(result).toEqual(updatedItem)
    })

    it('should update parent relationship', () => {
      const updatedItem = { id: 3, parent: '2', label: 'Айтем 3' }
      treeStore.updateItem(updatedItem)

      expect(treeStore.getChildren(1)).toHaveLength(1)
      expect(treeStore.getChildren('2')).toHaveLength(4)
      expect(treeStore.getChildren('2').map((item) => item.id)).toContain(3)
    })

    it('should handle moving to null parent', () => {
      const updatedItem = { id: 3, parent: null, label: 'Айтем 3' }
      treeStore.updateItem(updatedItem)

      expect(treeStore.getChildren(1)).toHaveLength(1)
      expect(treeStore.getAllParents(3)).toHaveLength(1)
      expect(treeStore.getAllParents(3)[0].id).toBe(3)
    })

    it('should handle non-existent item', () => {
      const originalLength = treeStore.getAll().length
      treeStore.updateItem({ id: 999, parent: null, label: 'Non-existent' })

      expect(treeStore.getAll()).toHaveLength(originalLength)
      expect(treeStore.getItem(999)).toBeUndefined()
    })

    it('should not affect original item reference', () => {
      const updatedItem = { id: 1, parent: null, label: 'Updated Айтем 1' }
      treeStore.updateItem(updatedItem)
      updatedItem.label = 'Modified after update'
      expect(treeStore.getItem(1)?.label).toBe('Updated Айтем 1')
    })
  })

  describe('performance considerations', () => {
    it('should handle large datasets efficiently', () => {
      const largeItems: Item[] = []
      for (let i = 1; i <= 10000; i++) {
        largeItems.push({
          id: i,
          parent: i === 1 ? null : Math.floor(i / 2),
          label: `Item ${i}`,
        })
      }

      const start = performance.now()
      const largeStore = new TreeStore(largeItems)
      const constructionTime = performance.now() - start

      expect(constructionTime).toBeLessThan(100) // Should be very fast

      const lookupStart = performance.now()
      const item = largeStore.getItem(5000)
      const lookupTime = performance.now() - lookupStart

      expect(lookupTime).toBeLessThan(1) // Should be nearly instant
      expect(item?.id).toBe(5000)
    })
  })

  describe('TreeStore - Data Integrity and Edge Cases', () => {
    it('should throw error on cycle in initial data', () => {
      const items = [
        { id: 1, parent: 2, label: 'A' },
        { id: 2, parent: 3, label: 'B' },
        { id: 3, parent: 1, label: 'C' }, // cycle: 1 -> 2 -> 3 -> 1
      ]
      expect(() => new TreeStore(items)).toThrow()
    })

    it('should throw error when update creates a cycle', () => {
      const items = [
        { id: 1, parent: null, label: 'A' },
        { id: 2, parent: 1, label: 'B' },
        { id: 3, parent: 2, label: 'C' },
      ]
      const store = new TreeStore(items)
      expect(() => store.updateItem({ id: 1, parent: 3, label: 'A' })).toThrow()
    })

    it('should treat "2" and 2 as different ids', () => {
      const items = [
        { id: 1, parent: null, label: 'A' },
        { id: '2', parent: 1, label: 'B' },
      ]
      const store = new TreeStore(items)
      store.addItem({ id: 2, parent: 1, label: 'C' })
      expect(store.getItem('2')).toEqual({ id: '2', parent: 1, label: 'B' })
      expect(store.getItem(2)).toEqual({ id: 2, parent: 1, label: 'C' })
      expect(store.getAll().length).toBe(3)
    })

    it('should throw error when adding an already existing id', () => {
      const items = [
        { id: 1, parent: null, label: 'A' },
        { id: 2, parent: 1, label: 'B' },
      ]
      const store = new TreeStore(items)
      expect(() => store.addItem({ id: 1, parent: null, label: 'Duplicate' })).toThrow()
    })

    it('should handle updating parent to null and update children/parents correctly', () => {
      const items = [
        { id: 1, parent: null, label: 'A' },
        { id: 2, parent: 1, label: 'B' },
        { id: 3, parent: 2, label: 'C' },
      ]
      const store = new TreeStore(items)
      store.updateItem({ id: 3, parent: null, label: 'C' })
      expect(store.getAllParents(3).map((i) => i.id)).toEqual([3])
      expect(store.getAllChildren(1).map((i) => i.id)).toEqual([2])
      expect(store.getAllChildren(2).map((i) => i.id)).toEqual([])
      expect(store.getAllChildren(3).map((i) => i.id)).toEqual([])
    })

    it('should return empty array for getAllChildren/getAllParents on non-existent id', () => {
      const items = [
        { id: 1, parent: null, label: 'A' },
        { id: 2, parent: 1, label: 'B' },
      ]
      const store = new TreeStore(items)
      expect(store.getAllChildren(999)).toEqual([])
      expect(store.getAllParents(999)).toEqual([])
    })
  })
})

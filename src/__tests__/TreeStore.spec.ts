import { describe, test, expect, beforeEach } from 'vitest'
import { TreeStore, type Item } from '@/store/TreeStore'
import { items } from '@/constants/items'

describe('TreeStore', () => {
  let treeStore: TreeStore

  beforeEach(() => {
    treeStore = new TreeStore(items)
  })

  describe('constructor', () => {
    test('should initialize TreeStore with items', () => {
      const store = new TreeStore(items)
      expect(store).toBeInstanceOf(TreeStore)
    })

    test('should handle empty array', () => {
      const store = new TreeStore([])
      expect(store.getAll()).toEqual([])
    })
  })

  describe('getAll', () => {
    test('should return all items in original order', () => {
      const result = treeStore.getAll()
      expect(result).toEqual(items)
    })

    test('should return a copy of items (not reference)', () => {
      const result = treeStore.getAll()
      expect(result).not.toBe(items)
      expect(result[0]).not.toBe(items[0])
    })

    test('should return new copies on each call', () => {
      const first = treeStore.getAll()
      const second = treeStore.getAll()
      expect(first[0]).not.toBe(second[0])
    })
  })

  describe('getItem', () => {
    test('should return item by id', () => {
      const result = treeStore.getItem(1)
      expect(result).toEqual({ id: 1, parentId: null, label: 'Айтем 1' })
    })

    test('should return item by string id', () => {
      const result = treeStore.getItem('2')
      expect(result).toEqual({ id: '2', parentId: 1, label: 'Айтем 2' })
    })

    test('should return undefined for non-existent id', () => {
      const result = treeStore.getItem(999)
      expect(result).toBeUndefined()
    })

    test('should return a copy of item (not reference)', () => {
      const result = treeStore.getItem(1)
      const original = items.find((item) => item.id === 1)
      expect(result).not.toBe(original)
    })
  })

  describe('getChildren', () => {
    test('should return direct children', () => {
      const result = treeStore.getChildren(1)
      expect(result).toHaveLength(2)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining(['2', 3]))
    })

    test('should return direct children for string id', () => {
      const result = treeStore.getChildren('2')
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining([4, 5, 6]))
    })

    test('should return new copies on each call', () => {
      const first = treeStore.getChildren(1)
      const second = treeStore.getChildren(1)
      expect(first[0]).not.toBe(second[0])
    })

    test('should return empty array if no children', () => {
      const result = treeStore.getChildren(7)
      expect(result).toEqual([])
    })

    test('should return empty array for non-existent id', () => {
      const result = treeStore.getChildren(999)
      expect(result).toEqual([])
    })
  })

  describe('getAllChildren', () => {
    test('should return all children recursively', () => {
      const result = treeStore.getAllChildren(1)
      expect(result).toHaveLength(7)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining(['2', 3, 4, 5, 6, 7, 8]))
    })

    test('should return all children for intermediate node', () => {
      const result = treeStore.getAllChildren('2')
      expect(result).toHaveLength(5)
      expect(result.map((item) => item.id)).toEqual(expect.arrayContaining([4, 5, 6, 7, 8]))
    })

    test('should return empty array if no children', () => {
      const result = treeStore.getAllChildren(7)
      expect(result).toEqual([])
    })

    test('should return empty array for non-existent id', () => {
      const result = treeStore.getAllChildren(999)
      expect(result).toEqual([])
    })
  })

  describe('getAllParents', () => {
    test('should return all parents including self', () => {
      const result = treeStore.getAllParents(7)
      expect(result).toHaveLength(4)
      expect(result.map((item) => item.id)).toEqual([7, 4, '2', 1])
    })

    test('should return only self for root element', () => {
      const result = treeStore.getAllParents(1)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    test('should return correct order for intermediate element', () => {
      const result = treeStore.getAllParents(4)
      expect(result).toHaveLength(3)
      expect(result.map((item) => item.id)).toEqual([4, '2', 1])
    })

    test('should return empty array for non-existent id', () => {
      const result = treeStore.getAllParents(999)
      expect(result).toEqual([])
    })
  })

  describe('addItem', () => {
    test('should add new item', () => {
      const newItem = { id: 9, parentId: 3, label: 'Айтем 9' }
      treeStore.addItem(newItem)

      expect(treeStore.getItem(9)).toEqual(newItem)
      expect(treeStore.getChildren(3)).toContainEqual(newItem)
      expect(treeStore.getAll()).toHaveLength(9)
    })

    test('should add root item', () => {
      const newItem = { id: 10, parentId: null, label: 'Айтем 10' }
      treeStore.addItem(newItem)

      expect(treeStore.getItem(10)).toEqual(newItem)
      expect(treeStore.getAll()).toHaveLength(9)
    })

    test('should not affect original item reference', () => {
      const newItem = { id: 9, parentId: 3, label: 'Айтем 9' }
      treeStore.addItem(newItem)

      newItem.label = 'Modified'
      expect(treeStore.getItem(9)?.label).toBe('Айтем 9')
    })
  })

  describe('removeItem', () => {
    test('should remove item and all its children', () => {
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

    test('should remove leaf item', () => {
      treeStore.removeItem(7)

      expect(treeStore.getItem(7)).toBeUndefined()
      expect(treeStore.getAll()).toHaveLength(7)
      expect(treeStore.getChildren(4)).toHaveLength(1)
    })

    test('should handle non-existent item', () => {
      const originalLength = treeStore.getAll().length

      expect(() => treeStore.removeItem(999)).toThrow()
      expect(treeStore.getAll()).toHaveLength(originalLength)
    })

    test('should remove child id from parent children set', () => {
      treeStore.removeItem(3)
      // After removal, parent 1 should not have 3 in its children set
      const childrenSet = treeStore['childrenMap'].get(1)
      expect(childrenSet?.has(3)).toBe(false)
    })
  })

  describe('updateItem', () => {
    test('should update item properties', () => {
      const updatedItem = { id: 1, parentId: null, label: 'Updated Айтем 1', newField: 'test' }
      treeStore.updateItem(updatedItem)

      const result = treeStore.getItem(1)
      expect(result).toEqual(updatedItem)
    })

    test('should update parent relationship', () => {
      const updatedItem = { id: 3, parentId: '2', label: 'Айтем 3' }
      treeStore.updateItem(updatedItem)

      expect(treeStore.getChildren(1)).toHaveLength(1)
      expect(treeStore.getChildren('2')).toHaveLength(4)
      expect(treeStore.getChildren('2').map((item) => item.id)).toContain(3)
    })

    test('should handle moving to null parent', () => {
      const updatedItem = { id: 3, parentId: null, label: 'Айтем 3' }
      treeStore.updateItem(updatedItem)

      expect(treeStore.getChildren(1)).toHaveLength(1)
      expect(treeStore.getAllParents(3)).toHaveLength(1)
      expect(treeStore.getAllParents(3)[0].id).toBe(3)
    })

    test('should handle non-existent item', () => {
      const originalLength = treeStore.getAll().length
      treeStore.updateItem({ id: 999, parentId: null, label: 'Non-existent' })

      expect(treeStore.getAll()).toHaveLength(originalLength)
      expect(treeStore.getItem(999)).toBeUndefined()
    })

    test('should not affect original item reference', () => {
      const updatedItem = { id: 1, parentId: null, label: 'Updated Айтем 1' }
      treeStore.updateItem(updatedItem)
      updatedItem.label = 'Modified after update'
      expect(treeStore.getItem(1)?.label).toBe('Updated Айтем 1')
    })
  })

  describe('performance considerations', () => {
    test('should handle large datasets efficiently', () => {
      const largeItems: Item[] = []
      for (let i = 1; i <= 10000; i++) {
        largeItems.push({
          id: i,
          parentId: i === 1 ? null : Math.floor(i / 2),
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
    test('should throw error on cycle in initial data', () => {
      const items = [
        { id: 1, parentId: 2, label: 'A' },
        { id: 2, parentId: 3, label: 'B' },
        { id: 3, parentId: 1, label: 'C' }, // cycle: 1 -> 2 -> 3 -> 1
      ]
      expect(() => new TreeStore(items)).toThrow()
    })

    test('should throw error when update creates a cycle', () => {
      const items = [
        { id: 1, parentId: null, label: 'A' },
        { id: 2, parentId: 1, label: 'B' },
        { id: 3, parentId: 2, label: 'C' },
      ]
      const store = new TreeStore(items)
      expect(() => store.updateItem({ id: 1, parentId: 3, label: 'A' })).toThrow()
    })

    test('should treat "2" and 2 as different ids', () => {
      const items = [
        { id: 1, parentId: null, label: 'A' },
        { id: '2', parentId: 1, label: 'B' },
      ]
      const store = new TreeStore(items)
      store.addItem({ id: 2, parentId: 1, label: 'C' })
      expect(store.getItem('2')).toEqual({ id: '2', parentId: 1, label: 'B' })
      expect(store.getItem(2)).toEqual({ id: 2, parentId: 1, label: 'C' })
      expect(store.getAll().length).toBe(3)
    })

    test('should throw error when adding an already existing id', () => {
      const items = [
        { id: 1, parentId: null, label: 'A' },
        { id: 2, parentId: 1, label: 'B' },
      ]
      const store = new TreeStore(items)
      expect(() => store.addItem({ id: 1, parentId: null, label: 'Duplicate' })).toThrow()
    })

    test('should handle updating parent to null and update children/parents correctly', () => {
      const items = [
        { id: 1, parentId: null, label: 'A' },
        { id: 2, parentId: 1, label: 'B' },
        { id: 3, parentId: 2, label: 'C' },
      ]
      const store = new TreeStore(items)
      store.updateItem({ id: 3, parentId: null, label: 'C' })
      expect(store.getAllParents(3).map((i) => i.id)).toEqual([3])
      expect(store.getAllChildren(1).map((i) => i.id)).toEqual([2])
      expect(store.getAllChildren(2).map((i) => i.id)).toEqual([])
      expect(store.getAllChildren(3).map((i) => i.id)).toEqual([])
    })

    test('should return empty array for getAllChildren/getAllParents on non-existent id', () => {
      const items = [
        { id: 1, parentId: null, label: 'A' },
        { id: 2, parentId: 1, label: 'B' },
      ]
      const store = new TreeStore(items)
      expect(store.getAllChildren(999)).toEqual([])
      expect(store.getAllParents(999)).toEqual([])
    })
    test('should correctly handle parent with value 0', () => {
      const itemsWithZeroParent = [
        { id: 0, parentId: null, label: 'Root Zero' },
        { id: 1, parentId: 0, label: 'Child One' },
        { id: 2, parentId: 0, label: 'Child Two' },
        { id: 3, parentId: 1, label: 'Grandchild Three' },
      ]
      const store = new TreeStore(itemsWithZeroParent)

      // Root node with id 0 should have two children: 1 and 2
      expect(store.getChildren(0).map((i) => i.id)).toEqual(expect.arrayContaining([1, 2]))

      // Child with id 1 should have one child: 3
      expect(store.getChildren(1).map((i) => i.id)).toEqual([3])

      // getAllParents for 3 should return [3, 1, 0]
      expect(store.getAllParents(3).map((i) => i.id)).toEqual([3, 1, 0])

      // getAllParents for 0 should return only itself
      expect(store.getAllParents(0).map((i) => i.id)).toEqual([0])
    })

    test('should correctly handle adding and updating items with parent 0', () => {
      const itemsWithZeroParent = [
        { id: 0, parentId: null, label: 'Root Zero' },
        { id: 1, parentId: 0, label: 'Child One' },
        { id: 2, parentId: 0, label: 'Child Two' },
        { id: 3, parentId: 1, label: 'Grandchild Three' },
      ]
      const store = new TreeStore(itemsWithZeroParent)

      // Add a new item with parent 0
      const newItem = { id: 4, parentId: 0, label: 'Child Four' }
      store.addItem(newItem)
      expect(store.getChildren(0).map((i) => i.id)).toEqual(expect.arrayContaining([1, 2, 4]))

      // Update an item's parent to 0
      store.updateItem({ id: 3, parentId: 0, label: 'Grandchild Three' })
      expect(store.getChildren(0).map((i) => i.id)).toEqual(expect.arrayContaining([1, 2, 3, 4]))
      expect(store.getAllParents(3).map((i) => i.id)).toEqual([3, 0])
    })
  })
})

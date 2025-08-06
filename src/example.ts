import { TreeStore } from './store/TreeStore'

const items = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '2', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '2', label: 'Айтем 4' },
  { id: 5, parent: '2', label: 'Айтем 5' },
  { id: 6, parent: '2', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
]

const treeStore = new TreeStore(items)

console.log('=== TreeStore Example ===')

console.log('\nAll items:')
console.log(treeStore.getAll())

console.log('\nGet item 1:')
console.log(treeStore.getItem(1))

console.log('\nDirect children of item 1:')
console.log(treeStore.getChildren(1))

console.log('\nAll children of item 1 (recursive):')
console.log(treeStore.getAllChildren(1))

console.log('\nAll parents of item 7:')
console.log(treeStore.getAllParents(7))

console.log('\nAdding new item...')
treeStore.addItem({ id: 9, parent: 3, label: 'Айтем 9' })

console.log('\nChildren of item 3 after adding:')
console.log(treeStore.getChildren(3))

console.log('\nUpdating item 3 to have parent 2...')
treeStore.updateItem({ id: 3, parent: '2', label: 'Updated Айтем 3' })

console.log('\nChildren of item 1 after update:')
console.log(treeStore.getChildren(1))

console.log('\nChildren of item 2 after update:')
console.log(treeStore.getChildren('2'))

console.log('\nRemoving item 2 and all its children...')
treeStore.removeItem('2')

console.log('\nAll items after removal:')
console.log(treeStore.getAll())

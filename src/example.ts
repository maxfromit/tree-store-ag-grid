import { TreeStore } from './store/TreeStore'
import { items } from './constants/items'

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
treeStore.addItem({ id: 9, parentId: 3, label: 'Айтем 9' })

console.log('\nChildren of item 3 after adding:')
console.log(treeStore.getChildren(3))

console.log('\nUpdating item 3 to have parent 2...')
treeStore.updateItem({ id: 3, parentId: '2', label: 'Updated Айтем 3' })

console.log('\nChildren of item 1 after update:')
console.log(treeStore.getChildren(1))

console.log('\nChildren of item 2 after update:')
console.log(treeStore.getChildren('2'))

console.log('\nRemoving item 2 and all its children...')
treeStore.removeItem('2')

console.log('\nAll items after removal:')
console.log(treeStore.getAll())

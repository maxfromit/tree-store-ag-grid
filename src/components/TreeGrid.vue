<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import l from 'lodash'
import { AgGridVue } from 'ag-grid-vue3'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import type {
  ColDef,
  ICellRendererParams,
  CellClassParams,
  NewValueParams,
  GetRowIdParams,
  GridReadyEvent,
  GridApi,
} from 'ag-grid-community'
import { RowGroupingModule, TreeDataModule } from 'ag-grid-enterprise'
import { TreeStore } from '@/store/TreeStore'
import { items } from '@/constants/items'
import 'ag-grid-enterprise'
import { themeQuartz } from 'ag-grid-community'
import { ArrowUturnRightIcon, ArrowUturnLeftIcon } from '@heroicons/vue/16/solid'
import TreeGroupCell from './components/TreeGroupCell.vue'
import { isGroupByParams, getCategoryLabel } from './utils'
import type { ItemId, Item } from '@/store/TreeStore'
import { useRefHistory } from '@vueuse/core'
import NewItemLabelDialog from './components/NewItemLabelDialog.vue'

const myTheme = themeQuartz.withParams({
  headerColumnBorder: true,
  pinnedColumnBorder: false,
})

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule, TreeDataModule])

const treeStoreInitial = new TreeStore(items)
const treeStore = ref(new TreeStore(items))

const itemsRef = computed(() => treeStore.value.getAll())
const { undo, redo } = useRefHistory(treeStore, { clone: l.cloneDeep, deep: true })

const agGrid = ref()

const mode = ref<'view' | 'edit'>('view')

const toggleMode = () => {
  mode.value = mode.value === 'view' ? 'edit' : 'view'
}

const applyBoldForGroup = (params: CellClassParams) => {
  if (l.toNumber(params.data.id) === 6) {
    console.log('applyBoldForGroup called with params:', params.node?.group, params?.rowIndex)
    const isGroup = params.node?.group === true
    console.log('applyBoldForGroup called with params:', isGroup, params.node)
  }
  // const isGroup = isGroupByParams(params)
  return isGroupByParams(params) ? 'font-bold' : ''
}
const gridApi = shallowRef<GridApi<Item[]> | null>(null)

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api
  console.log('Grid is ready:', params.api)
  console.log('Grid is ready:')
}

const columnDefs = ref<ColDef[]>([
  {
    headerName: '№ п\\п',
    valueGetter: 'node.sourceRowIndex + 1',
    flex: 0,
    width: 100,
    pinned: 'left',
    cellClass: 'font-bold',
  },
  {
    field: 'parent',
    headerName: 'Категория',
    rowGroup: true,
    hide: true,
  },
  {
    field: 'label',
    headerName: 'Наименование',
    editable: true,

    cellClass: (params: CellClassParams) => {
      return applyBoldForGroup(params) + ' cursor-text hover:text-blue-500 focus:text-blue-600'
    },
    onCellValueChanged: handleCellValueChanged,
  },
])

const isDialogShown = ref(false)

const addItem = (label: string) => {
  const newItem = {
    id: nextNumericId.value,
    label,
    parent: newItemParent.value,
  }
  treeStore.value.addItem(newItem)
  // const transaction = gridApi?.value?.applyTransaction({
  //   add: [[newItem]],
  // })
  // console.log('Transaction result:', transaction)
  dismissDialog()
}

const newItemParent = ref<ItemId | null>(null)
const showNewItemLabelDialog = (parent: ItemId) => {
  isDialogShown.value = true
  newItemParent.value = parent
  // emit('show-dialog', parent)

  // refreshGrid()
}

const dismissDialog = () => {
  isDialogShown.value = false
}

export type ShowNewItemLabelDialog = typeof showNewItemLabelDialog
export type DeleteItem = typeof deleteItem

const getAutoGroupColumnDef = () => {
  return {
    cellClass: applyBoldForGroup,
    cellRendererParams: {
      suppressCount: true,

      ...(mode.value === 'edit'
        ? { innerRenderer: TreeGroupCell }
        : {
            innerRenderer: getCategoryLabel,
          }),

      // ...(mode.value === 'edit'
      //   ? { innerRenderer: TreeGroupCell }
      //   : {
      //       innerRenderer: (p) =>
      //         renderBoldIfParent({
      //           params: p,
      //           customRegular: 'Элемент',
      //           customBold: 'Группа',
      //         }),
      //     }),

      innerRendererParams: {
        action: {
          showDialog: showNewItemLabelDialog,
          delete: deleteItem,
        },
      },
    },
  }
}

const deleteItem = (id: ItemId) => {
  console.log('handleDelete called with id:', id)
  treeStore.value.removeItem(id)
  // refreshItems()
}
const getRowId = (params: GetRowIdParams<Item, any>) => {
  return l.toString(params.data.id)
}

function handleCellValueChanged(event: NewValueParams<Item, string, any>) {
  console.log('handleCellValueChanged called with event:', event)
  if (event.colDef.field === 'label' && l.isString(event.newValue) && !l.isEmpty(event.newValue)) {
    console.log('Updating item with new label:', event.newValue)
    treeStore.value.updateItem({
      ...event.data,
      label: event.newValue,
    })
  }
}

const gridOptions = computed(() => ({
  // rowData: itemsClone.value,
  theme: myTheme,
  columnDefs: columnDefs.value,
  defaultColDef: {
    // cellRenderer: renderBoldIfParent,
    resizable: false,
    flex: 1,
    sortable: false,
  },
  treeData: true,
  treeDataParentIdField: 'parent',
  getRowId: (params: GetRowIdParams<Item, any>) => l.toString(params.data.id),
  autoGroupColumnDef: getAutoGroupColumnDef(),
  // autoGroupColumnDef: {
  //   // headerName: 'Категория',
  //   // field: 'parent',
  //   // cellRenderer: TreeGroupCell,
  //   cellRendererParams: {
  //     suppressCount: true,
  //     // innerRendererFramework: TreeGroupCell,

  //     ...(mode.value === 'edit'
  //       ? { innerRenderer: TreeGroupCell }
  //       : {
  //           innerRenderer: (p) =>
  //             renderBoldIfParent({
  //               params: p,
  //               customRegular: 'Элемент',
  //               customBold: 'Группа',
  //             }),
  //         }),

  //     // innerRenderer: (p) => renderBoldIfParent(p, 'Элемент', 'Группа'),
  //     // innerRenderer: mode.value === 'edit' ? TreeGroupCell : undefined,

  //     innerRendererParams: {
  //       action: {
  //         add: handleAdd,
  //         delete: handleDelete,
  //       },
  //     },
  //   },
  // },
}))

const nextNumericId = computed(() => {
  const all = treeStore.value.getAll()
  const numericIds = l.filter(
    l.map(all, (item: Item) => (l.isNumber(item.id) ? item.id : null)),
    l.isNumber,
  )
  return !l.isEmpty(numericIds) ? (l.max(numericIds) ?? 0) + 1 : 1
})
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-200 p-2 gap-2">
    itemsRef {{ itemsRef }}
    <div class="flex flex-row items-center gap-2 text-blue-500 p-2">
      <div>
        Режим:
        <span
          @click="toggleMode"
          class="cursor-pointer hover:text-blue-600 focus:text-blue-700 transition-colors"
        >
          {{ mode === 'view' ? 'просмотр' : 'редактирование' }}
        </span>
      </div>
      <div v-if="mode === 'edit'" class="flex flex-row items-center gap-1">
        <button type="button" @click="undo">
          <ArrowUturnLeftIcon class="w-4 h-4 hover:text-blue-600 focus:text-blue-700" />
        </button>
        <button type="button" @click="redo">
          <ArrowUturnRightIcon class="w-4 h-4 hover:text-blue-600 focus:text-blue-700" />
        </button>
      </div>
    </div>

    <ag-grid-vue
      ref="agGrid"
      :rowData="itemsRef"
      @grid-ready="onGridReady"
      :theme="gridOptions.theme"
      :columnDefs="gridOptions.columnDefs"
      :defaultColDef="gridOptions.defaultColDef"
      :treeData="gridOptions.treeData"
      :treeDataParentIdField="gridOptions.treeDataParentIdField"
      :getRowId="getRowId"
      :autoGroupColumnDef="getAutoGroupColumnDef()"
      class="ag-theme-quartz flex-1 min-h-0 flex flex-col"
    />
  </div>

  <NewItemLabelDialog v-if="isDialogShown" @cancel="dismissDialog" @add-name="addItem" />
</template>

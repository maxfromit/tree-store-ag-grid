<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
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
  ValueFormatterParams,
} from 'ag-grid-community'
import { RowGroupingModule, TreeDataModule, RowNumbersModule } from 'ag-grid-enterprise'
import { TreeStore } from '@/store/TreeStore'
import { items } from '@/constants/items'
import 'ag-grid-enterprise'
import { themeQuartz } from 'ag-grid-community'
import { ArrowUturnRightIcon, ArrowUturnLeftIcon } from '@heroicons/vue/16/solid'
import TreeGroupCell from './components/TreeGroupCell.vue'
import { getCategoryLabel } from './utils'
import type { ItemId, Item } from '@/store/TreeStore'
import { useRefHistory } from '@vueuse/core'
import NewItemLabelDialog from './components/NewItemLabelDialog.vue'

ModuleRegistry.registerModules([
  AllCommunityModule,
  RowGroupingModule,
  TreeDataModule,
  RowNumbersModule,
])
const myTheme = themeQuartz.withParams({
  headerColumnBorder: true,
  pinnedColumnBorder: false,
})
const gridApi = shallowRef<GridApi<Item[]> | null>(null)
const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api
}

const treeStore = ref(new TreeStore(items))
const itemsRef = computed(() => treeStore.value.getAll())
const { undo, redo } = useRefHistory(treeStore, { clone: l.cloneDeep, deep: true })
const isParent = (id: ItemId) => !l.isEmpty(treeStore.value.getChildren(id))

const mode = ref<'view' | 'edit'>('view')
const toggleMode = () => {
  mode.value = mode.value === 'view' ? 'edit' : 'view'
}

const applyBoldForGroup = (params: CellClassParams) => {
  return isParent(params.data.id) ? 'font-bold' : ''
}

const valueFormatter = (params: ValueFormatterParams) => {
  return params.value
}

const columnDefs = ref<ColDef[]>([
  {
    field: 'parent',
    headerName: 'Категория',
    rowGroup: true,
    hide: true,
  },
  {
    field: 'label',
    headerName: 'Наименование',
    editable: mode.value === 'edit' ? true : false,

    cellClass: (params: CellClassParams) => {
      return (
        applyBoldForGroup(params) +
        (mode.value === 'edit' ? ' cursor-text hover:text-blue-500 focus:text-blue-600' : '')
      )
    },
    onCellValueChanged: handleCellValueChanged,
  },
])

const rowNumbersFormatter = (params: ValueFormatterParams) => {
  return params?.value
}

const isDialogShown = ref(false)

const addItem = async (label: string) => {
  const newItem = {
    id: nextNumericId.value,
    label,
    parent: newItemParent.value,
  }
  treeStore.value.addItem(newItem)
  const node = gridApi?.value?.getRowNode(l.toString(newItem.parent))
  dismissDialog()

  await new Promise((resolve) => setTimeout(resolve, 300))
  if (node) {
    gridApi?.value?.setRowNodeExpanded(node, true, true)
  }
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
export type IsParent = typeof isParent

const getAutoGroupColumnDef = () => {
  return {
    cellClass: applyBoldForGroup,
    cellRendererParams: {
      suppressCount: true,

      ...(mode.value === 'edit'
        ? { innerRenderer: TreeGroupCell }
        : {
            innerRenderer: (params: ICellRendererParams) =>
              getCategoryLabel(isParent(params.data.id)),
          }),

      innerRendererParams: {
        isParent: isParent,
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
    valueFormatter,
    // cellRenderer: renderBoldIfParent,
    resizable: false,
    flex: 1,
    sortable: false,
  },
  treeData: true,
  treeDataParentIdField: 'parent',
  getRowId: (params: GetRowIdParams<Item, any>) => l.toString(params.data.id),
  autoGroupColumnDef: getAutoGroupColumnDef(),
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
      :rowData="itemsRef"
      @grid-ready="onGridReady"
      :theme="gridOptions.theme"
      :columnDefs="gridOptions.columnDefs"
      :defaultColDef="gridOptions.defaultColDef"
      :treeData="gridOptions.treeData"
      :treeDataParentIdField="gridOptions.treeDataParentIdField"
      :getRowId="getRowId"
      :autoGroupColumnDef="getAutoGroupColumnDef()"
      :rowNumbers="{ headerName: '№ п\\п', valueFormatter: rowNumbersFormatter }"
      class="ag-theme-quartz flex-1 min-h-0 flex flex-col"
    />
  </div>

  <NewItemLabelDialog v-if="isDialogShown" @cancel="dismissDialog" @add-name="addItem" />
</template>

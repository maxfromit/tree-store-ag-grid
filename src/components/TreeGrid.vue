<script setup lang="ts">
import { ref, computed, shallowRef, type Ref } from 'vue'
import l from 'lodash'
import { useRefHistory } from '@vueuse/core'
import { AgGridVue } from 'ag-grid-vue3'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import type {
  ICellRendererParams,
  CellClassParams,
  NewValueParams,
  GetRowIdParams,
  GridReadyEvent,
  GridApi,
} from 'ag-grid-community'
import 'ag-grid-enterprise'
import { themeQuartz } from 'ag-grid-community'
import { RowGroupingModule, TreeDataModule, RowNumbersModule } from 'ag-grid-enterprise'
import { ArrowUturnRightIcon, ArrowUturnLeftIcon } from '@heroicons/vue/16/solid'

import { TreeStore } from '@/store/TreeStore'
import { items } from '@/constants/items'
import { getCategoryLabel } from './utils'

import TreeGroupCell from './components/TreeGroupCell.vue'

import NewItemLabelDialog from './components/NewItemLabelDialog.vue'
import type { ItemId, Item } from '@/store/TreeStore'

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

const applyBoldForGroup = (params: CellClassParams) => (isParent(params.data.id) ? 'font-bold' : '')

const { isDialogShown, getParentAndShowNewItemLabelDialog, dismissDialog, addItem } =
  useAddWithDialog()

const deleteItem = (id: ItemId) => treeStore.value.removeItem(id)

const gridOptions = ref({
  columnDefs: () => [
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
      onCellValueChanged: (event: NewValueParams<Item, string, any>) => {
        if (l.isString(event.newValue)) {
          treeStore.value.updateItem({
            ...event.data,
            label: event.newValue,
          })
        }
      },
    },
  ],

  defaultColDef: {
    resizable: false,
    flex: 1,
    sortable: false,
  },

  treeData: true,
  treeDataParentIdField: 'parent',
  getRowId: (params: GetRowIdParams<Item, any>) => l.toString(params.data.id),
  autoGroupColumnDef: () => {
    return {
      headerName: 'Категория',
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
            showDialog: getParentAndShowNewItemLabelDialog,
            delete: deleteItem,
          },
        },
      },
    }
  },
  rowNumbers: true,
  theme: myTheme,
})

function useAddWithDialog() {
  const isDialogShown = ref(false)

  const dismissDialog = () => {
    isDialogShown.value = false
  }

  const newItemParent = ref<ItemId | null>(null)

  const getParentAndShowNewItemLabelDialog = (parent: ItemId) => {
    newItemParent.value = parent
    isDialogShown.value = true
  }

  const addItem = (label: string) => {
    const newItem = {
      id: nextNumericId.value,
      label,
      parent: newItemParent.value,
    }
    treeStore.value.addItem(newItem)
    const node = gridApi?.value?.getRowNode(l.toString(newItem.parent))
    dismissDialog()

    setTimeout(() => {
      if (node) {
        gridApi?.value?.setRowNodeExpanded(node, true, true)
      }
    }, 300)
  }

  const nextNumericId = computed(() => {
    const all = treeStore.value.getAll()
    const numericIds = l.filter(
      l.map(all, (item: Item) => (l.isNumber(item.id) ? item.id : null)),
      l.isNumber,
    )
    return !l.isEmpty(numericIds) ? (l.max(numericIds) ?? 0) + 1 : 1
  })

  return {
    isDialogShown,
    dismissDialog,
    getParentAndShowNewItemLabelDialog,
    addItem,
  }
}

export type ShowNewItemLabelDialog = typeof getParentAndShowNewItemLabelDialog
export type DeleteItem = typeof deleteItem
export type IsParent = typeof isParent
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
      :columnDefs="gridOptions.columnDefs()"
      :defaultColDef="gridOptions.defaultColDef"
      :treeData="gridOptions.treeData"
      :treeDataParentIdField="gridOptions.treeDataParentIdField"
      :getRowId="gridOptions.getRowId"
      :autoGroupColumnDef="gridOptions.autoGroupColumnDef()"
      :rowNumbers="gridOptions.rowNumbers"
      class="ag-theme-quartz flex-1 min-h-0 flex flex-col"
    />
  </div>

  <NewItemLabelDialog v-if="isDialogShown" @cancel="dismissDialog" @add-name="addItem" />
</template>

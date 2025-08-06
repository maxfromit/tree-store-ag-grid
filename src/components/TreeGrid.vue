<script setup lang="ts">
import { ref, computed } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { ModuleRegistry, AllCommunityModule, type ColDef } from 'ag-grid-community'
import { RowGroupingModule, TreeDataModule } from 'ag-grid-enterprise'
import { TreeStore } from '@/store/TreeStore'
import { items } from '@/constants/items'
import 'ag-grid-enterprise'
import { themeQuartz } from 'ag-grid-community'
import { ArrowUturnRightIcon, ArrowUturnLeftIcon } from '@heroicons/vue/16/solid'
// import './style.css'

const myTheme = themeQuartz.withParams({
  headerColumnBorder: true,
  pinnedColumnBorder: false,
})

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule, TreeDataModule])

const treeStore = new TreeStore(items)
const mode = ref<'view' | 'edit'>('view')
const toggleMode = () => {
  mode.value = mode.value === 'view' ? 'edit' : 'view'
}

const renderBoldIfParent = (
  params: any,
  customRegularText?: string,
  customBoldText?: string,
  allBold?: boolean,
) => {
  let makeBold = false
  if (!allBold) {
    const isChild = treeStore.getChildren(params.data.id).length === 0
    makeBold = !isChild
  }
  if (allBold) {
    makeBold = true
  }
  return makeBold
    ? `<b>${customBoldText || `${params.value || ''}`}</b>`
    : `${customRegularText || params.value || ''}`
}

const columnDefs = ref<ColDef[]>([
  {
    headerName: '№ п\\п',
    valueGetter: 'node.sourceRowIndex + 1',
    cellRenderer: (p) => renderBoldIfParent(p, undefined, undefined, true),
    flex: 0,
    width: 100,
    pinned: 'left',
  },
  { field: 'parent', headerName: 'Категория', rowGroup: true, hide: true },
  {
    field: 'label',
    headerName: 'Наименование',
  },
])

const gridOptions = computed(() => ({
  style: { headerRowBorder: true },

  rowData: treeStore.getAll(),
  theme: myTheme,
  columnDefs: columnDefs.value,
  defaultColDef: {
    cellClass: 'logoCell',
    cellRenderer: renderBoldIfParent,
    resizable: false,
    flex: 1,

    // innerRenderer: (p) => {
    //   console.log('pdata', p.data)
    //   const isChild = treeStore.getChildren(p.data.id).length === 0
    //   console.log('p', treeStore.getChildren(p.data.id))
    //   return isChild ? 'Элемент' : '<b>Группа</b>'
    // }, // Use the default group cell renderer
  },
  treeData: true,
  treeDataParentIdField: 'parent',
  // groupHideOpenParents: true,
  // groupDisplayType: 'multipleColumn',
  getRowId: (params: any) => params.data.id,

  autoGroupColumnDef: {
    headerName: 'Категория',
    field: 'parent',
    cellRendererParams: {
      suppressCount: true,
      innerRenderer: (p) => renderBoldIfParent(p, 'Элемент', 'Группа'),
    },
  },
}))
</script>

<template>
  <div class="tree-grid-wrapper">
    <div class="tree-grid-header flex-row-centered">
      <div>
        Режим:
        <span @click="toggleMode" class="cursor-pointer">
          {{ mode === 'view' ? 'просмотр' : 'редактирование' }}
        </span>
      </div>
      <div class="flex-row-centered gap-5">
        <ArrowUturnLeftIcon class="icon" />
        <ArrowUturnRightIcon class="icon" />
      </div>
    </div>
    <ag-grid-vue :gridOptions="gridOptions" class="ag-theme-quartz tree-grid-content" />
  </div>
</template>

<style scoped lang="scss">
.icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  // color: #222;
  // margin-left: 12px;
}

.gap-5 {
  gap: 5px;
}
.tree-grid-wrapper {
  display: flex;
  flex-direction: column;
  height: 500px;
  background-color: #ebebeb;
  padding: 10px;
  gap: 10px;
}

.flex-row-centered {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.tree-grid-header {
  gap: 10px;
  color: #4788e3;
  padding: 10px;
}

.cursor-pointer {
  cursor: pointer;
}

.tree-grid-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  //  flex: 1;
  // min-height: 0;
  width: 100%;
}
</style>

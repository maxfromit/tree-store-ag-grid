<script setup lang="ts">
import { ref } from 'vue'
import { AgGridVue } from 'ag-grid-vue3' // Vue Data Grid Component
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { TreeStore } from '@/store/TreeStore'
import { items } from '@/constants/items'

ModuleRegistry.registerModules([AllCommunityModule])

const treeStore = new TreeStore(items)
console.log(treeStore.getAll())
const rowData = ref(treeStore.getAll())

// Column Definitions: Defines the columns to be displayed.
const colDefs = ref([{ field: 'id' }, { field: 'parent' }, { field: 'label' }])
</script>

<template>
  <ag-grid-vue :rowData="rowData" :columnDefs="colDefs" style="height: 500px"> </ag-grid-vue>
</template>

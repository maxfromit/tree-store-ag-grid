<script setup lang="ts">
import { computed } from 'vue'
import { getCategoryLabel } from '../utils'
import { PlusCircleIcon, XCircleIcon } from '@heroicons/vue/16/solid'
import type { ICellRendererParams } from 'ag-grid-community'
import type { ShowNewItemLabelDialog, DeleteItem, IsParent } from '../TreeGrid.vue'

const props = defineProps<{
  params: ICellRendererParams & {
    isParent: IsParent
    action: {
      showDialog: ShowNewItemLabelDialog
      delete: DeleteItem
    }
  }
}>()

const label = computed(() => {
  return getCategoryLabel(props.params.isParent(props.params.data?.id))
})

function showDialogInParent() {
  props.params.action.showDialog(props.params.data?.id)
}

function deleteItemInParent() {
  props.params.action.delete(props.params.data?.id)
}
</script>

<template>
  <div class="flex flex-row items-center gap-2 justify-between">
    <div>{{ label }}</div>

    <div class="flex flex-row items-center gap-1">
      <button @click.stop="showDialogInParent" type="button">
        <PlusCircleIcon class="text-green-500 w-5 h-5 hover:text-green-600 focus:text-green-700" />
      </button>

      <button @click.stop="deleteItemInParent" type="button">
        <XCircleIcon class="text-red-500 w-5 h-5 hover:text-red-600 focus:text-red-700" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { getCategoryLabel } from '../utils'
import { PlusCircleIcon, XCircleIcon } from '@heroicons/vue/16/solid'
import type { ICellRendererParams } from 'ag-grid-community'
import type { ShowNewItemLabelDialog, DeleteItem } from '../TreeGrid.vue'
// import Dialog from './Dialog.vue'

const props = defineProps<{
  params: ICellRendererParams & {
    action: {
      showDialog: ShowNewItemLabelDialog
      delete: DeleteItem
    }
  }
}>()

watch(
  () => props.params?.node,
  () => {
    console.log('node changed:', props.params?.node)
  },
)

const label = computed(() => {
  // console.log('\ngetCategoryLabel calls data', props?.params?.data.id)
  // console.log('getCategoryLabel calls data', props?.params?.data)
  // console.log('getCategoryLabel calls value', props?.params?.value)
  // console.log('getCategoryLabel calls node', props?.params?.node)

  // console.log('getCategoryLabel calls  props?.params?.node.group', props?.params?.node?.group)
  // console.log(
  //   'getCategoryLabel calls  props?.params?.node.allChildrenCount',
  //   props?.params?.node?.allChildrenCount,
  // )

  // console.log(
  //   'getCategoryLabel calls props?.params?.node && props?.params?.node.group',
  //   props?.params?.node && props?.params?.node?.group,
  // )

  return getCategoryLabel(props.params)
})

function onAdd() {
  props.params.action.showDialog(props.params.data?.id)
  // showDialog.value = true
  // newItemLabel.value = ''
}

function onDelete() {
  console.log('onDelete called with id:', props.params.data?.id)
  props.params.action.delete(props.params.data?.id)
}
</script>

<template>
  <div class="flex flex-row items-center gap-2 justify-between">
    <div>{{ label }}</div>

    <div class="flex flex-row items-center gap-1">
      <button @click.stop="onAdd" type="button">
        <PlusCircleIcon class="text-green-500 w-4 h-4 hover:text-green-600 focus:text-green-700" />
      </button>

      <button @click.stop="onDelete" type="button">
        <XCircleIcon class="text-red-500 w-4 h-4 hover:text-red-600 focus:text-red-700" />
      </button>
    </div>
  </div>
</template>

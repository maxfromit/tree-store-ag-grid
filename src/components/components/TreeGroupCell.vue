<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getCategoryLabel } from '../utils'
import { PlusCircleIcon, XCircleIcon } from '@heroicons/vue/16/solid'
import type { ICellRendererParams } from 'ag-grid-community'
import type { HandleAdd, HandleDelete } from '../TreeGrid.vue'
// import Dialog from './Dialog.vue'

const props = defineProps<{
  params: ICellRendererParams & {
    action: {
      add: HandleAdd
      delete: HandleDelete
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

const showDialog = ref(false)
const newItemName = ref('')

function onAdd() {
  showDialog.value = true
  newItemName.value = ''
}

function onDelete() {
  console.log('onDelete called with id:', props.params.data?.id)
  props.params.action.delete(props.params.data?.id)
}
function handleDialogOk() {
  console.log('New item name:', newItemName.value)
  const itemToAdd = { parent: props.params.data?.id, label: newItemName.value }
  props.params.action.add(itemToAdd)

  showDialog.value = false
}
function handleDialogCancel() {
  showDialog.value = false
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

    <div v-if="showDialog" class="fixed top-10 flex justify-center items-center z-[10000]">
      <div class="bg-white p-2 rounded-lg shadow-lg flex flex-col gap-2 min-w-20">
        <div>Введите имя нового элемента:</div>
        <input v-model="newItemName" type="text" autofocus class="border rounded px-2 py-1" />
        <div class="flex flex-row gap-2 justify-end mt-2">
          <button
            @click="handleDialogOk"
            :disabled="!newItemName.trim()"
            class="px-3 rounded bg-gray-100 hover:bg-gray-200 focus:bg-gray-200"
          >
            OK
          </button>
          <button
            @click="handleDialogCancel"
            class="px-2 rounded bg-gray-100 hover:bg-gray-200 focus:bg-gray-300"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

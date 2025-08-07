<script setup lang="ts">
import { ref } from 'vue'
import l from 'lodash'

const emit = defineEmits<{
  (e: 'add-name', value: string): void
  (e: 'cancel'): void
}>()

const newItemLabel = ref('')

function handleOk() {
  if (l.isEmpty(l.trim(newItemLabel.value))) {
    return
  }
  emit('add-name', newItemLabel.value)
}

function handleCancel() {
  emit('cancel')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleOk()
  }
  if (e.key === 'Escape') {
    handleCancel()
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-[10000]">
    <div class="bg-white py-3 px-4 rounded-lg shadow-lg flex flex-col gap-3 min-w-30">
      <div class="text-lg font-semibold">Добавление элемента</div>

      <div class="flex flex-col gap-1">
        <div class="text-sm font-light">Введите имя нового элемента</div>
        <input
          v-model="newItemLabel"
          @keydown="handleKeydown"
          type="text"
          autofocus
          class="border rounded px-2 py-1"
        />
      </div>

      <div class="flex flex-row gap-2 justify-end mt-2">
        <button
          @click="handleCancel"
          class="px-3 py-0.5 rounded hover:bg-gray-200 focus:bg-gray-400 text-sm font-light"
        >
          ОТМЕНА
        </button>
        <button
          @click="handleOk"
          :disabled="!l.trim(newItemLabel)"
          class="px-3 py-0.5 rounded bg-gray-200 hover:bg-gray-300 focus:bg-gray-400 text-sm font-light"
        >
          ДОБАВИТЬ
        </button>
      </div>
    </div>
  </div>
</template>

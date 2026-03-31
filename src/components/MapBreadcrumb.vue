<template>
  <nav class="map-breadcrumb">
    <button
      class="breadcrumb-back"
      :disabled="!canGoBack"
      @click="$emit('back')"
      aria-label="Volver"
    >
      ←
    </button>
    <template v-for="(crumb, i) in breadcrumbs" :key="i">
      <span v-if="i > 0" class="breadcrumb-separator">›</span>
      <button
        :class="['breadcrumb-item', { active: i === breadcrumbs.length - 1 }]"
        :disabled="i === breadcrumbs.length - 1"
        @click="i < breadcrumbs.length - 1 && $emit('navigate', crumb)"
      >
        {{ crumb.label }}
      </button>
    </template>
  </nav>
</template>

<script setup>
defineProps({
  breadcrumbs: { type: Array, required: true },
  canGoBack: { type: Boolean, default: false },
})

defineEmits(['back', 'navigate'])
</script>

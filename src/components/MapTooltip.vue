<template>
  <div
    :class="['map-tooltip', { visible }]"
    :style="{ left: x + 'px', top: y + 'px' }"
  >
    <div class="tooltip-name">{{ name }}</div>
    <div v-if="status && level === 'municipality'" class="tooltip-status">
      ✓ Hemos trabajado aquí
      <span v-if="status.year"> · {{ status.year }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  x: Number,
  y: Number,
  name: String,
  status: Object,
  level: String,
})
</script>

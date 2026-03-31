<template>
  <div class="app-container">
    <SpainMap />
  </div>
</template>

<script setup>
import SpainMap from './components/SpainMap.vue'
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-dark);
}
</style>

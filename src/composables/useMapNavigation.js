import { ref, computed } from 'vue'
import { CCAA } from '../data/ccaa-codes.js'
import { PROVINCES } from '../data/province-codes.js'

export function useMapNavigation() {
  const level = ref('ccaa') // 'ccaa' | 'province' | 'municipality'
  const selectedCcaa = ref(null) // CODAUTO string
  const selectedProvince = ref(null) // CPRO string
  const transitioning = ref(false)

  const breadcrumbs = computed(() => {
    const crumbs = [{ label: 'España', level: 'ccaa', id: null }]
    if (selectedCcaa.value) {
      const ccaaData = CCAA[selectedCcaa.value]
      crumbs.push({
        label: ccaaData?.name || selectedCcaa.value,
        level: ccaaData?.uniprovincial ? 'municipality' : 'province',
        id: selectedCcaa.value,
      })
    }
    if (selectedProvince.value && !CCAA[selectedCcaa.value]?.uniprovincial) {
      const provData = PROVINCES[selectedProvince.value]
      crumbs.push({
        label: provData?.name || selectedProvince.value,
        level: 'municipality',
        id: selectedProvince.value,
      })
    }
    return crumbs
  })

  const currentLabel = computed(() => {
    const crumbs = breadcrumbs.value
    return crumbs[crumbs.length - 1]?.label || 'España'
  })

  function clickCcaa(codauto) {
    if (transitioning.value) return
    const ccaaData = CCAA[codauto]
    selectedCcaa.value = codauto

    if (ccaaData?.uniprovincial) {
      // Skip province level - go directly to municipalities
      selectedProvince.value = ccaaData.cpro
      level.value = 'municipality'
    } else {
      level.value = 'province'
    }
  }

  function clickProvince(cpro) {
    if (transitioning.value) return
    selectedProvince.value = cpro
    level.value = 'municipality'
  }

  function goBack() {
    if (transitioning.value) return
    if (level.value === 'municipality') {
      const ccaaData = CCAA[selectedCcaa.value]
      if (ccaaData?.uniprovincial) {
        // Uniprovincial: go back to full map
        selectedCcaa.value = null
        selectedProvince.value = null
        level.value = 'ccaa'
      } else {
        // Go back to province view
        selectedProvince.value = null
        level.value = 'province'
      }
    } else if (level.value === 'province') {
      selectedCcaa.value = null
      level.value = 'ccaa'
    }
  }

  function navigateTo(crumb) {
    if (transitioning.value) return
    if (crumb.level === 'ccaa' && crumb.id === null) {
      selectedCcaa.value = null
      selectedProvince.value = null
      level.value = 'ccaa'
    } else if (crumb.level === 'province') {
      selectedProvince.value = null
      level.value = 'province'
    }
    // municipality crumbs are current level, no action needed
  }

  const canGoBack = computed(() => level.value !== 'ccaa')

  return {
    level,
    selectedCcaa,
    selectedProvince,
    transitioning,
    breadcrumbs,
    currentLabel,
    canGoBack,
    clickCcaa,
    clickProvince,
    goBack,
    navigateTo,
  }
}

<template>
  <div class="spain-map-wrapper">
    <MapBreadcrumb
      :breadcrumbs="nav.breadcrumbs.value"
      :canGoBack="nav.canGoBack.value"
      @back="handleBack"
      @navigate="handleBreadcrumbClick"
    />
    <div class="map-container" ref="containerRef" @mousemove="handleContainerMouseMove">
      <svg
        ref="svgRef"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        preserveAspectRatio="xMidYMid meet"
        class="map-svg"
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feFlood flood-color="#00d4ff" flood-opacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="blur" />
            <feFlood flood-color="#00d4ff" flood-opacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Dark background -->
        <rect :width="svgWidth" :height="svgHeight" fill="var(--bg-dark)" />

        <!-- Context outline (faded Spain when zoomed in) -->
        <path
          v-if="contextOutlinePath && nav.level.value !== 'ccaa'"
          :d="contextOutlinePath"
          class="context-outline"
        />

        <!-- Active layer paths -->
        <g class="active-layer" ref="activeLayerRef">
          <path
            v-for="f in currentFeatures"
            :key="f.id"
            :d="featurePath(f)"
            :class="['region-path', { worked: isWorkedFeature(f) }]"
            @click="handleFeatureClick(f)"
            @mouseenter="handleMouseEnter($event, f)"
            @mouseleave="handleMouseLeave"
          />
        </g>

        <!-- Border mesh with glow -->
        <path
          v-if="meshPath"
          :d="meshPath"
          class="border-mesh"
        />

        <!-- Inset border for Canary Islands -->
        <path
          v-if="insetBorderPath && nav.level.value === 'ccaa'"
          :d="insetBorderPath"
          class="inset-border"
        />
      </svg>

      <!-- Tooltip -->
      <MapTooltip
        :visible="tooltip.visible"
        :x="tooltip.x"
        :y="tooltip.y"
        :name="tooltip.name"
        :status="tooltip.status"
        :level="nav.level.value"
      />

      <!-- Legend (only at municipality level) -->
      <MapLegend v-if="nav.level.value === 'municipality'" />

      <!-- Loading overlay -->
      <div v-if="isLoading" class="map-loading">
        <div class="loading-spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { easeBackOut } from 'd3'
import { geoConicConformalSpain } from 'd3-composite-projections'
import * as topojson from 'topojson-client'
import MapBreadcrumb from './MapBreadcrumb.vue'
import MapTooltip from './MapTooltip.vue'
import MapLegend from './MapLegend.vue'
import { useMapNavigation } from '../composables/useMapNavigation.js'
import { useMapData } from '../composables/useMapData.js'
import { CCAA } from '../data/ccaa-codes.js'
import { PROVINCES } from '../data/province-codes.js'

const svgWidth = 960
const svgHeight = 700

const svgRef = ref(null)
const containerRef = ref(null)
const activeLayerRef = ref(null)
const isLoading = ref(true)

const nav = useMapNavigation()
const mapData = useMapData()

// Current features to render
const currentFeatures = ref([])
const meshPath = ref(null)
const contextOutlinePath = ref(null)
const insetBorderPath = ref(null)

// Path generator
let pathGen = null
let fullSpainPathGen = null
let fullSpainProjection = null

// Tooltip state
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  status: null,
})

function featurePath(feature) {
  return pathGen ? pathGen(feature) : ''
}

function isWorkedFeature(f) {
  if (nav.level.value !== 'municipality') return false
  return mapData.isWorked(f.id)
}

// Initialize map
onMounted(async () => {
  try {
    // Load CCAA data
    await mapData.loadCcaa()
    await mapData.loadStatus()

    // Setup full Spain projection
    const features = mapData.getCcaaFeatures()
    const proj = geoConicConformalSpain()
    const collection = { type: 'FeatureCollection', features }
    proj.fitExtent([[30, 10], [svgWidth - 30, svgHeight - 10]], collection)
    fullSpainProjection = proj
    fullSpainPathGen = d3.geoPath(proj)
    pathGen = fullSpainPathGen

    // Render CCAA
    currentFeatures.value = features
    updateMesh()
    updateInsetBorder()

    isLoading.value = false

    // Preload provinces
    mapData.preloadProvinces()
  } catch (err) {
    console.error('Failed to initialize map:', err)
    isLoading.value = false
  }
})

function updateMesh() {
  const level = nav.level.value
  let mesh = null
  if (level === 'ccaa') {
    mesh = mapData.getCcaaMesh()
  } else if (level === 'province') {
    mesh = mapData.getProvinceMesh(nav.selectedCcaa.value)
  } else if (level === 'municipality') {
    mesh = mapData.getMunicipalityMesh(nav.selectedProvince.value)
  }
  meshPath.value = mesh && pathGen ? pathGen(mesh) : null
}

function updateContextOutline() {
  if (nav.level.value === 'ccaa') {
    contextOutlinePath.value = null
    return
  }
  const outline = mapData.getCcaaOutline()
  contextOutlinePath.value = outline && fullSpainPathGen ? fullSpainPathGen(outline) : null
}

function updateInsetBorder() {
  if (nav.level.value !== 'ccaa') {
    insetBorderPath.value = null
    return
  }
  // Use the composite projection's getCompositionBorders
  if (fullSpainProjection && fullSpainProjection.getCompositionBorders) {
    const borderPath = d3.geoPath()(fullSpainProjection.getCompositionBorders())
    insetBorderPath.value = borderPath
  }
}

// Transition between views
async function transitionToView(getFeatures, fitFeatures) {
  nav.transitioning.value = true
  isLoading.value = true

  try {
    const features = await getFeatures()
    if (!features || features.length === 0) {
      nav.transitioning.value = false
      isLoading.value = false
      return
    }

    // Animate out current layer
    if (svgRef.value) {
      const activePaths = d3.select(activeLayerRef.value).selectAll('path')
      await activePaths
        .transition()
        .duration(300)
        .ease(easeBackOut)
        .style('opacity', 0)
        .end()
        .catch(() => {})
    }

    // Switch projection to fit new features
    if (fitFeatures) {
      const collection = { type: 'FeatureCollection', features }
      const proj = d3.geoConicConformal()
        .fitExtent([[20, 20], [svgWidth - 20, svgHeight - 20]], collection)
      pathGen = d3.geoPath(proj)
    }

    // Update features
    currentFeatures.value = features
    await nextTick()

    // Update mesh and context
    updateMesh()
    updateContextOutline()
    updateInsetBorder()

    // Animate in new layer
    if (svgRef.value) {
      const activePaths = d3.select(activeLayerRef.value).selectAll('path')
      activePaths.style('opacity', 0)
      await activePaths
        .transition()
        .duration(500)
        .ease(easeBackOut)
        .style('opacity', 1)
        .end()
        .catch(() => {})
    }
  } finally {
    nav.transitioning.value = false
    isLoading.value = false
  }
}

async function transitionToFullSpain() {
  nav.transitioning.value = true

  // Animate out
  if (svgRef.value) {
    const activePaths = d3.select(activeLayerRef.value).selectAll('path')
    await activePaths
      .transition()
      .duration(300)
      .ease(easeBackOut)
      .style('opacity', 0)
      .end()
      .catch(() => {})
  }

  // Restore full Spain projection
  pathGen = fullSpainPathGen
  currentFeatures.value = mapData.getCcaaFeatures()
  await nextTick()

  updateMesh()
  updateContextOutline()
  updateInsetBorder()

  // Animate in
  if (svgRef.value) {
    const activePaths = d3.select(activeLayerRef.value).selectAll('path')
    activePaths.style('opacity', 0)
    await activePaths
      .transition()
      .duration(500)
      .ease(easeBackOut)
      .style('opacity', 1)
      .end()
      .catch(() => {})
  }

  nav.transitioning.value = false
}

// Click handlers
function handleFeatureClick(feature) {
  if (nav.transitioning.value) return
  tooltip.visible = false

  if (nav.level.value === 'ccaa') {
    const codauto = feature.id
    nav.clickCcaa(codauto)
    const ccaaData = CCAA[codauto]

    if (ccaaData?.uniprovincial) {
      // Go directly to municipalities
      transitionToView(async () => {
        await mapData.loadMunicipalities(ccaaData.cpro)
        return mapData.getMunicipalityFeatures(ccaaData.cpro)
      }, true)
    } else {
      // Go to provinces
      transitionToView(async () => {
        await mapData.loadProvinces()
        return mapData.getProvinceFeatures(codauto)
      }, true)
    }
  } else if (nav.level.value === 'province') {
    const cpro = feature.id
    nav.clickProvince(cpro)
    transitionToView(async () => {
      await mapData.loadMunicipalities(cpro)
      return mapData.getMunicipalityFeatures(cpro)
    }, true)
  }
  // At municipality level, clicks don't navigate further
}

function handleBack() {
  if (nav.transitioning.value) return
  tooltip.visible = false

  const prevLevel = nav.level.value
  const prevCcaa = nav.selectedCcaa.value

  nav.goBack()

  if (nav.level.value === 'ccaa') {
    transitionToFullSpain()
  } else if (nav.level.value === 'province') {
    transitionToView(async () => {
      await mapData.loadProvinces()
      return mapData.getProvinceFeatures(prevCcaa)
    }, true)
  }
}

function handleBreadcrumbClick(crumb) {
  if (nav.transitioning.value) return
  tooltip.visible = false

  if (crumb.level === 'ccaa' && crumb.id === null) {
    nav.navigateTo(crumb)
    transitionToFullSpain()
  } else if (crumb.level === 'province') {
    nav.navigateTo(crumb)
    transitionToView(async () => {
      await mapData.loadProvinces()
      return mapData.getProvinceFeatures(crumb.id)
    }, true)
  }
}

// Tooltip handlers
function handleMouseEnter(event, feature) {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  tooltip.visible = true
  tooltip.x = event.clientX - rect.left + 12
  tooltip.y = event.clientY - rect.top - 8
  tooltip.name = feature.properties?.name || feature.id

  if (nav.level.value === 'municipality') {
    tooltip.status = mapData.getMuniStatus(feature.id)
  } else {
    tooltip.status = null
  }
}

function handleMouseLeave() {
  tooltip.visible = false
}

// Update tooltip position on mouse move over container
function handleContainerMouseMove(event) {
  if (!tooltip.visible) return
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  tooltip.x = event.clientX - rect.left + 12
  tooltip.y = event.clientY - rect.top - 8
}
</script>

<style scoped>
.spain-map-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

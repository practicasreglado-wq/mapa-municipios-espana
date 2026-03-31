import { ref, shallowRef } from 'vue'
import * as topojson from 'topojson-client'
import { PROVINCES } from '../data/province-codes.js'

const ccaaTopo = shallowRef(null)
const provincesTopo = shallowRef(null)
const municipalityCache = new Map() // cpro -> topoJSON
const statusData = ref({ meta: {}, municipios: {} })

let provincesLoading = null
let statusLoading = null

export function useMapData() {
  const loading = ref(false)

  async function loadCcaa() {
    if (ccaaTopo.value) return ccaaTopo.value
    const resp = await fetch('/data/ccaa.json')
    ccaaTopo.value = await resp.json()
    return ccaaTopo.value
  }

  async function loadProvinces() {
    if (provincesTopo.value) return provincesTopo.value
    if (provincesLoading) return provincesLoading
    provincesLoading = fetch('/data/provinces.json').then(r => r.json())
    provincesTopo.value = await provincesLoading
    return provincesTopo.value
  }

  async function loadMunicipalities(cpro) {
    if (municipalityCache.has(cpro)) return municipalityCache.get(cpro)
    const resp = await fetch(`/data/municipalities/${cpro}.json`)
    const topo = await resp.json()
    municipalityCache.set(cpro, topo)
    return topo
  }

  async function loadStatus() {
    if (statusLoading) return statusLoading
    statusLoading = fetch('/data/municipios-status.json')
      .then(r => r.json())
      .then(data => {
        statusData.value = data
        return data
      })
    return statusLoading
  }

  function getCcaaFeatures() {
    if (!ccaaTopo.value) return []
    return topojson.feature(ccaaTopo.value, ccaaTopo.value.objects.autonomous_regions).features
  }

  function getCcaaMesh() {
    if (!ccaaTopo.value) return null
    return topojson.mesh(ccaaTopo.value, ccaaTopo.value.objects.autonomous_regions, (a, b) => a !== b)
  }

  function getCcaaOutline() {
    if (!ccaaTopo.value) return null
    return topojson.mesh(ccaaTopo.value, ccaaTopo.value.objects.autonomous_regions)
  }

  function getCompositionBorder() {
    if (!ccaaTopo.value || !ccaaTopo.value.objects.border) return null
    return topojson.feature(ccaaTopo.value, ccaaTopo.value.objects.border)
  }

  function getProvinceFeatures(codauto) {
    if (!provincesTopo.value) return []
    const all = topojson.feature(provincesTopo.value, provincesTopo.value.objects.provinces).features
    return all.filter(f => PROVINCES[f.id]?.codauto === codauto)
  }

  function getProvinceMesh(codauto) {
    if (!provincesTopo.value) return null
    return topojson.mesh(
      provincesTopo.value,
      provincesTopo.value.objects.provinces,
      (a, b) => a !== b && PROVINCES[a.id]?.codauto === codauto && PROVINCES[b.id]?.codauto === codauto
    )
  }

  function getMunicipalityFeatures(cpro) {
    const topo = municipalityCache.get(cpro)
    if (!topo) return []
    return topojson.feature(topo, topo.objects.municipalities).features
  }

  function getMunicipalityMesh(cpro) {
    const topo = municipalityCache.get(cpro)
    if (!topo) return null
    return topojson.mesh(topo, topo.objects.municipalities, (a, b) => a !== b)
  }

  function isWorked(muniId) {
    return !!statusData.value.municipios[muniId]?.worked
  }

  function getMuniStatus(muniId) {
    return statusData.value.municipios[muniId] || null
  }

  // Preload provinces in background after initial render
  function preloadProvinces() {
    if (!provincesTopo.value && !provincesLoading) {
      requestIdleCallback ? requestIdleCallback(() => loadProvinces()) : setTimeout(() => loadProvinces(), 500)
    }
  }

  return {
    loading,
    statusData,
    loadCcaa,
    loadProvinces,
    loadMunicipalities,
    loadStatus,
    getCcaaFeatures,
    getCcaaMesh,
    getCcaaOutline,
    getCompositionBorder,
    getProvinceFeatures,
    getProvinceMesh,
    getMunicipalityFeatures,
    getMunicipalityMesh,
    isWorked,
    getMuniStatus,
    preloadProvinces,
  }
}

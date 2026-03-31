import { ref } from 'vue'
import * as d3 from 'd3'
import { geoConicConformalSpain } from 'd3-composite-projections'

export function useMapProjection(width, height) {
  const projection = ref(null)
  const pathGenerator = ref(null)

  function initFullSpain(features) {
    const proj = geoConicConformalSpain()
    const collection = { type: 'FeatureCollection', features }
    // The composite projection is pre-configured, just fit to size
    proj.fitSize([width, height], collection)
    projection.value = proj
    pathGenerator.value = d3.geoPath(proj)
  }

  function fitToFeatures(features, padding = 20) {
    // Use a standard conic conformal for sub-regions
    const collection = { type: 'FeatureCollection', features }
    const proj = d3.geoConicConformal()
      .fitExtent(
        [[padding, padding], [width - padding, height - padding]],
        collection
      )
    projection.value = proj
    pathGenerator.value = d3.geoPath(proj)
  }

  function getPath() {
    return pathGenerator.value
  }

  function getProjection() {
    return projection.value
  }

  return {
    projection,
    pathGenerator,
    initFullSpain,
    fitToFeatures,
    getPath,
    getProjection,
  }
}

import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

async function main() {
  // 1. Convert Excel to JSON catalog
  console.log('Reading diccionario26.xlsx...')
  const wb = XLSX.readFile(join(ROOT, 'diccionario26.xlsx'))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

  // Find header row (row with CODAUTO, CPRO, etc.)
  let headerIdx = -1
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    if (rows[i] && rows[i].some(c => String(c).includes('CODAUTO'))) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) throw new Error('Could not find header row')

  const headers = rows[headerIdx].map(h => String(h).trim())
  const colIdx = {
    codauto: headers.indexOf('CODAUTO'),
    cpro: headers.indexOf('CPRO'),
    cmun: headers.indexOf('CMUN'),
    dc: headers.indexOf('DC'),
    nombre: headers.indexOf('NOMBRE'),
  }

  const municipios = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[colIdx.cpro]) continue
    const codauto = String(row[colIdx.codauto]).padStart(2, '0')
    const cpro = String(row[colIdx.cpro]).padStart(2, '0')
    const cmun = String(row[colIdx.cmun]).padStart(3, '0')
    const id = cpro + cmun
    municipios.push({
      id,
      codauto,
      cpro,
      cmun,
      dc: String(row[colIdx.dc]),
      nombre: String(row[colIdx.nombre]),
    })
  }

  console.log(`Parsed ${municipios.length} municipalities`)

  const catalogDir = join(ROOT, 'public', 'data')
  await writeFile(
    join(catalogDir, 'municipios-catalogo.json'),
    JSON.stringify(municipios, null, 0),
    'utf8'
  )
  console.log('Written municipios-catalogo.json')

  // 2. Split municipalities TopoJSON by province
  console.log('Splitting municipalities by province...')
  const topoFull = JSON.parse(
    await readFile(join(catalogDir, 'municipalities-full.json'), 'utf8')
  )
  const muniGeoms = topoFull.objects.municipalities.geometries
  const provGeoms = topoFull.objects.provinces
    ? topoFull.objects.provinces.geometries
    : []

  // Group municipality geometries by province code (first 2 digits of id)
  const byProvince = {}
  for (const geom of muniGeoms) {
    const prov = String(geom.id).substring(0, 2)
    if (!byProvince[prov]) byProvince[prov] = []
    byProvince[prov].push(geom)
  }

  const muniDir = join(catalogDir, 'municipalities')
  if (!existsSync(muniDir)) await mkdir(muniDir, { recursive: true })

  for (const [prov, geoms] of Object.entries(byProvince)) {
    // Create a standalone TopoJSON for this province's municipalities
    const provTopo = {
      type: 'Topology',
      arcs: topoFull.arcs,
      transform: topoFull.transform,
      objects: {
        municipalities: {
          type: 'GeometryCollection',
          geometries: geoms,
        },
      },
    }
    await writeFile(
      join(muniDir, `${prov}.json`),
      JSON.stringify(provTopo),
      'utf8'
    )
  }

  console.log(`Split into ${Object.keys(byProvince).length} province files`)

  // 3. Create sample municipios-status.json
  const statusFile = join(catalogDir, 'municipios-status.json')
  if (!existsSync(statusFile)) {
    const status = {
      meta: { lastUpdated: new Date().toISOString().slice(0, 10), totalWorked: 0 },
      municipios: {},
    }
    await writeFile(statusFile, JSON.stringify(status, null, 2), 'utf8')
    console.log('Created municipios-status.json template')
  }

  console.log('Done!')
}

main().catch(console.error)

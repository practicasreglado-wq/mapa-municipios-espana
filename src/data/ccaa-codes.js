// CODAUTO → Community data (INE 2026)
// uniprovincial: true means click goes directly to municipalities
export const CCAA = {
  '01': { name: 'Andalucía', uniprovincial: false },
  '02': { name: 'Aragón', uniprovincial: false },
  '03': { name: 'Principado de Asturias', uniprovincial: true, cpro: '33' },
  '04': { name: 'Illes Balears', uniprovincial: true, cpro: '07' },
  '05': { name: 'Canarias', uniprovincial: false },
  '06': { name: 'Cantabria', uniprovincial: true, cpro: '39' },
  '07': { name: 'Castilla y León', uniprovincial: false },
  '08': { name: 'Castilla-La Mancha', uniprovincial: false },
  '09': { name: 'Cataluña', uniprovincial: false },
  '10': { name: 'Comunitat Valenciana', uniprovincial: false },
  '11': { name: 'Extremadura', uniprovincial: false },
  '12': { name: 'Galicia', uniprovincial: false },
  '13': { name: 'Comunidad de Madrid', uniprovincial: true, cpro: '28' },
  '14': { name: 'Región de Murcia', uniprovincial: true, cpro: '30' },
  '15': { name: 'Comunidad Foral de Navarra', uniprovincial: true, cpro: '31' },
  '16': { name: 'País Vasco', uniprovincial: false },
  '17': { name: 'La Rioja', uniprovincial: true, cpro: '26' },
  '18': { name: 'Ceuta', uniprovincial: true, cpro: '51' },
  '19': { name: 'Melilla', uniprovincial: true, cpro: '52' },
}

// Reverse lookup: CPRO → CODAUTO
export const PROVINCE_TO_CCAA = {}
// Build from province-codes for completeness, but also provide quick lookup

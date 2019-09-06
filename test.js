const fs = require('fs')
const { invertS2 } = require('./lib').default

const land = JSON.parse(fs.readFileSync('./features/land10m.s2json', 'utf8'))

// const land = {
//   type: 'S2Feature',
//   properties: Object,
//   face: 0,
//   geometry: {
//     type: 'Polygon',
//     // coordinates: [ [[-1.5, -1.5], [0, -1.5], [0, 0], [-1.5, 0], [-1.5, -1.5]] ]
//     // coordinates: [ [[-1.5, 1.5], [-1.5, 0], [0, 0], [0, 1.5], [-1.5, 1.5]] ]
//     // coordinates: [ [[1.5, 1.5], [0, 1.5], [0, 0], [1.5, 0], [1.5, 1.5]] ]
//   }
// }

// land.features = [land.features[2]]

const invertedLand = invertS2(land)

invertedLand.features = invertedLand.features.filter(feature => {
  if (feature.face === 0) return true
  else return false
}).map(feature => {
  feature.type = 'Feature'
  return feature
})

invertedLand.type = 'FeatureCollection'

fs.writeFileSync('./invertedLand10m.s2json', JSON.stringify(invertedLand, null, 2))

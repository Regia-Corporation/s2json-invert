const fs = require('fs')

const sea = JSON.parse(fs.readFileSync('./sea110m.s2json', 'utf8'))

sea.features = sea.features.filter(feature => {
  if (feature.face === 5) return true
  else return false
}).map(feature => {
  feature.type = 'Feature'
  return feature
})
// }).filter((feature, i) => {
//   if (i < 5) return true
//   else return false
// })
sea.type = 'FeatureCollection'

fs.writeFileSync('./seaFace.json', JSON.stringify(sea, null, 2))

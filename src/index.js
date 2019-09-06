// @flow
type Feature = {
  type: 'S2Feature',
  properties: Object,
  face?: Face,
  geometry: {
    type: 'Point' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | '3DPoint' | '3DLineString' | '3DMultiLineString' | '3DPolygon' | '3DMultiPolygon',
    coordinates: any
  }
}

type FeatureCollection = {
  type: 'S2FeatureCollection',
  features: Array<Feature>
}

export default function invertS2 (input: Feature | FeatureCollection) {
  return input
}

// @flow
const turf = require('@turf/turf')

import type { Face } from 's2projection'

type S2Feature = {
  type: 'S2Feature',
  properties: Object,
  face: Face,
  geometry: {
    type: 'Point' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | '3DPoint' | '3DLineString' | '3DMultiLineString' | '3DPolygon' | '3DMultiPolygon',
    coordinates: any
  }
}

type S2FeatureCollection = {
  type: 'S2FeatureCollection',
  features: Array<S2Feature>,
  faces: Array<Face>
}

type Point = [number, number]

type LineString = Array<Point>

type Polygon = Array< Array<Point> >

type MultiPolygon = Array< Array< Array<Point> > >

function invertS2 (input: S2Feature | S2FeatureCollection): S2FeatureCollection {
  // only update Polygons and MultiPolygons
  // invert all 6 faces
  // if polygon sits on the outside, we need to adjust the outer polygon, otherwise just add "holes"
  const newFeatureCollection = {
    type: 'S2FeatureCollection',
    faces: [0, 1, 2, 3, 4, 5],
    features: []
  }

  for (let i = 0; i < 6; i++) {
    // get current face and create a full polygon
    const face = i
    console.log('face', face)
    let mainFeature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [ [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5], [-1.5, -1.5]] ]
      }
    }

    // now we warp the the full polygon by the features it contains
    if (input.type === 'S2Feature') { // its one feature
      if (input.face === face) {
        if (input.geometry.type === 'Polygon' || input.geometry.type === 'MultiPolygon') {
          input.type = 'Feature' // fix for turf
          const kinked = cleanFeature(input)
          if (kinked) continue
          mainFeature = turf.difference(mainFeature, input)
        }
      }
    } else {
      for (let feature of input.features) {
        if (feature.face === face) {
          if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            feature.type = 'Feature' // fix for turf
            const kinked = cleanFeature(feature)
            if (kinked) continue
            mainFeature = turf.difference(mainFeature, feature)
          }
        }
      }
    }
    // add proper data
    mainFeature.face = face
    mainFeature.type = 'S2Feature'
    // add to collection
    newFeatureCollection.features.push(mainFeature)
  }

  return newFeatureCollection
}

function cleanFeature(feature: S2Feature) {
  // if a feature has two points in the same position, this causes an error...
  // if a feature has an intersection with the edge at only ONE point, this causes an error...
  // consider: [[0,0], [-1.5, 0], [0, 0.5]], it only intersects in the middle, so it confuses the
  // turf.difference function
  if (feature.geometry.type === 'Polygon') {
    for (let j = 0, pl = feature.geometry.coordinates.length; j < pl; j++) {
      const ring = feature.geometry.coordinates[j]
      const ringSet = new Set()
      for (let i = 0; i < ring.length - 1; i++) {
        const point = ring[i][0] + '_' + ring[i][1]
        if (ringSet.has(point)) {
          feature.geometry.coordinates[j].splice(i, 1)
          i--
        } else {
          ringSet.add(point)
        }
      }
      // for (let i = 0; i < ring.length - 1; i++) {
      //   const point = ring[i]
      //   const nextPoint = ring[i + 1]
      //   // remove duplicates
      //   if (point[0] === nextPoint[0] && point[1] === nextPoint[1]) {
      //     feature.geometry.coordinates[j].splice(i, 1)
      //     i--
      //   }
      // }
      for (let i = 0; i < ring.length - 2; i++) {
        const point = ring[i]
        const middlePoint = ring[i + 1]
        const endPoint = ring[i + 2]
        if (!isEdge(point) && isEdge(middlePoint) && !isEdge(endPoint)) {
          feature.geometry.coordinates[j].splice(i + 1, 1)
          i--
        }
      }
    }
  } else {
    for (let k = 0, fl = feature.geometry.coordinates.length; k < fl; k++) {
      const poly = feature.geometry.coordinates[k]
      for (let j = 0, pl = poly.length; j < pl; j++) {
        const ring = poly[j]
        for (let i = 0; i < ring.length - 1; i++) {
          const point = ring[i]
          const nextPoint = ring[i + 1]
          if (point[0] === nextPoint[0] && point[1] === nextPoint[1]) {
            feature.geometry.coordinates[k][j].splice(i, 1)
            i--
          }
        }
        for (let i = 0; i < ring.length - 2; i++) {
          const point = ring[i]
          const middlePoint = ring[i + 1]
          const endPoint = ring[i + 2]
          if (!isEdge(point) && isEdge(middlePoint) && !isEdge(endPoint)) {
            feature.geometry.coordinates[k][j].splice(i + 1, 1)
            i--
          }
        }
      }
    }
  }
  const kinks = turf.kinks(feature)
  // if kinks still remain, just drop it, it's bad geometry
  if (kinks.features.length) return true
  return false
}

function isEdge(point: Point): boolean {
  if (Math.abs(point[0]) === 1.5 || Math.abs(point[1]) === 1.5) return true
  return false
}

exports.default = {
  invertS2
}

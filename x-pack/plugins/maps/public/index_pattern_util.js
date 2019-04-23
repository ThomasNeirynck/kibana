/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { indexPatternService } from './kibana_services';
import { DECIMAL_DEGREES_PRECISION } from '../common/constants';
import _ from 'lodash';


export async function getIndexPatternsFromIds(indexPatternIds) {

  const promises = [];
  indexPatternIds.forEach((id) => {
    const indexPatternPromise = indexPatternService.get(id);
    if (indexPatternPromise) {
      promises.push(indexPatternPromise);
    }
  });

  return await Promise.all(promises);

}


export function createShapeFilter(geojsonPolygon, indexPatternId, geoField) {

  //take outer
  const points  = geojsonPolygon.coordinates[0].map(coordinatePair => {
    return {
      lon: _.round(coordinatePair[0], DECIMAL_DEGREES_PRECISION),
      lat: _.round(coordinatePair[1], DECIMAL_DEGREES_PRECISION)
    };
  });
  const field = geoField;
  const filter = { meta: { negate: false, index: indexPatternId } };
  filter.geo_polygon = { ignore_unmapped: true };
  filter.geo_polygon[field] = {
    points: points
  };
  return filter;
}

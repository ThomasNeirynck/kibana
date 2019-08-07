/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import _ from 'lodash';
import { ORIGIN } from './origin';

export class TMSService {

  _getRasterStyleJson = _.once(async () => {
    const rasterUrl = this._getRasterStyleUrl();
    const url = this._proxyPath + rasterUrl;
    return this._emsClient.getManifest(this._emsClient.extendUrlWithParams(url));
  });

  _getVectorStyleJson = _.once(async () => {
    const vectorUrl = this._getVectorStyleUrl();
    const url = this._proxyPath + vectorUrl;
    const vectorJson =  await this._emsClient.getManifest(this._emsClient.extendUrlWithParams(url));

    const inlinedSources = {};
    for (const sourceName in vectorJson.sources) {
      if (vectorJson.sources.hasOwnProperty(sourceName)) {
        const sourceUrl = vectorJson.sources[sourceName].url;
        const extendedUrl = this._emsClient.extendUrlWithParams(sourceUrl);
        const sourceJson = await this._emsClient.getManifest(extendedUrl);


        const extendedTileUrls = sourceJson.tiles.map(tileUrl => this._emsClient.extendUrlWithParams(tileUrl));
        inlinedSources[sourceName] = {
          type: 'vector',
          ...sourceJson,
          tiles: extendedTileUrls
        };
      }
    }
    vectorJson.sources = inlinedSources;
    return vectorJson;
  });

  constructor(config, emsClient, proxyPath) {
    this._config = config;
    this._emsClient = emsClient;
    this._proxyPath = proxyPath;
  }

  _getRasterFormats(locale) {
    return this._config.formats.filter(format => {
      return format.locale === locale && format.format === 'raster';
    });
  }

  _getVectorFormats(locale) {
    return this._config.formats.filter(format => {
      return format.locale === locale && format.format === 'vector';
    });
  }

  _getVectorStyleUrl() {
    let vectorFormats = this._getVectorFormats(this._emsClient.getLocale());
    if (!vectorFormats.length) {//fallback to default locale
      vectorFormats = this._getVectorFormats(this._emsClient.getDefaultLocale());
    }
    if (!vectorFormats.length) {
      throw new Error(`Cannot find vector tile layer for locale ${this._emsClient.getLocale()} or ${this._emsClient.getDefaultLocale()}`);
    }
    const defaultStyle = vectorFormats[0];
    if (defaultStyle && defaultStyle.hasOwnProperty('url')) {
      return defaultStyle.url;
    }
  }


  _getRasterStyleUrl() {
    let rasterFormats = this._getRasterFormats(this._emsClient.getLocale());
    if (!rasterFormats.length) {//fallback to default locale
      rasterFormats = this._getRasterFormats(this._emsClient.getDefaultLocale());
    }
    if (!rasterFormats.length) {
      throw new Error(`Cannot find raster tile layer for locale ${this._emsClient.getLocale()} or ${this._emsClient.getDefaultLocale()}`);
    }
    const defaultStyle = rasterFormats[0];
    if (defaultStyle && defaultStyle.hasOwnProperty('url')) {
      return defaultStyle.url;
    }
  }

  async getDefaultRasterStyle() {
    return await this._getRasterStyleJson();
  }

  async getUrlTemplate() {
    const tileJson = await this._getRasterStyleJson();
    const directUrl = this._proxyPath + tileJson.tiles[0];
    return this._emsClient.extendUrlWithParams(directUrl);
  }

  async getVectorStyleSheet() {
    return await this._getVectorStyleJson();
  }

  async getSpriteSheetMeta() {
    const vsjson = await this._getVectorStyleJson();
    //hardcode to retina
    const metaUrl = vsjson.sprite + '@2x.json';
    const spritePngs =  vsjson.sprite + '@2x.png';
    const metaUrlExtended = this._emsClient.extendUrlWithParams(metaUrl);
    const jsonMeta = await this._emsClient.getManifest(metaUrlExtended);
    return {
      png: spritePngs,
      json: jsonMeta
    };
  }

  getDisplayName() {
    return this._emsClient.getValueInLanguage(this._config.name);
  }

  getAttributions() {
    return this._config.attribution.map(attribution => {
      const url = this._emsClient.getValueInLanguage(attribution.url);
      const label = this._emsClient.getValueInLanguage(attribution.label);
      return {
        url: url,
        label: label
      };
    });
  }

  getHTMLAttribution() {
    const attributions = this._config.attribution.map(attribution => {
      const url = this._emsClient.getValueInLanguage(attribution.url);
      const label = this._emsClient.getValueInLanguage(attribution.label);
      const html = url ? `<a rel="noreferrer noopener" href="${url}">${label}</a>` : label;
      return this._emsClient.sanitizeHtml(`${html}`);
    });
    return `<p>${attributions.join(' | ')}</p>`;//!!!this is the current convention used in Kibana
  }

  getMarkdownAttribution() {
    const attributions = this._config.attribution.map(attribution => {
      const url = this._emsClient.getValueInLanguage(attribution.url);
      const label = this._emsClient.getValueInLanguage(attribution.label);
      return `[${label}](${url})`;
    });
    return attributions.join('|');
  }

  async getMinZoom() {
    const tileJson = await this._getRasterStyleJson();
    return tileJson.minzoom;
  }

  async getMaxZoom() {
    const tileJson = await this._getRasterStyleJson();
    return tileJson.maxzoom;
  }

  getId() {
    return this._config.id;
  }

  hasId(id) {
    return this._config.id === id;
  }

  getOrigin() {
    return ORIGIN.EMS;
  }
}

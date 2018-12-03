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


export class FileLayer {

  constructor(config, emsClient) {
    this._config = config;
    this._emsClient = emsClient;
  }



  getHTMLAttribution() {

    const attributions = this._config.attribution.map(attribution => {


      const url = this._emsClient.getValueInLanguage(attribution.url);
      const label = this._emsClient.getValueInLanguage(attribution.label);

      const html = `<a href=${url}>${label}</a>`;
      return this._emsClient.sanitizeHtml(html);
    });
    return attributions.join('|');
  }

  getFields() {
    return this._config.fields;
  }

  getDisplayName() {
    const layerName = this._emsClient.getValueInLanguage(this._config.layer_name);
    return (layerName)  ? layerName  : '';
  }

  getId() {
    return this._config.layer_id;
  }

  hasId(id) {
    const matchesLegacyId = this._config.legacy_ids.indexOf(id) >= 0;
    return this._config.layer_id === id || matchesLegacyId;
  }


}

import expect from 'expect.js';
import { fieldFormatMapFactory } from '../field_format_map';
import { resolveKibanaPath } from '@kbn/plugin-helpers';
const { FieldFormat } = require(resolveKibanaPath('src/ui/field_formats/field_format.js'));
const { FieldFormatsService } = require(resolveKibanaPath('src/ui/field_formats/field_formats_service.js'));
const { createBytesFormat } = require(resolveKibanaPath('src/core_plugins/kibana/common/field_formats/types/bytes.js'));
const { createNumberFormat } = require(resolveKibanaPath('src/core_plugins/kibana/common/field_formats/types/number.js'));

describe('field format map', function () {
  const indexPatternSavedObject = {
    id: 'logstash-*',
    type: 'index-pattern',
    version: 4,
    attributes: {
      title: 'logstash-*',
      timeFieldName: '@timestamp',
      notExpandable: true,
      fields: '[{"name":"field1","type":"number"}, {"name":"field2","type":"number"}]',
      fieldFormatMap: '{"field1":{"id":"bytes","params":{"pattern":"0,0.[0]b"}}}'
    }
  };
  const configMock = {};
  configMock['format:defaultTypeMap'] = {
    "number": { "id": "number", "params": {} }
  };
  configMock['format:number:defaultPattern'] = '0,0.[000]';
  const getConfig = (key) => configMock[key];
  const testValue = '4000';

  const fieldFormats = new FieldFormatsService([createBytesFormat(FieldFormat), createNumberFormat(FieldFormat)], getConfig);

  const formatMap = fieldFormatMapFactory(indexPatternSavedObject, fieldFormats);

  it('should build field format map with entry per index pattern field', function () {
    expect(formatMap.has('field1')).to.be(true);
    expect(formatMap.has('field2')).to.be(true);
    expect(formatMap.has('field_not_in_index')).to.be(false);
  });

  it('should create custom FieldFormat for fields with configured field formatter', function () {
    expect(formatMap.get('field1').convert(testValue)).to.be('3.9KB');
  });

  it('should create default FieldFormat for fields with no field formatter', function () {
    expect(formatMap.get('field2').convert(testValue)).to.be('4,000');
  });
});

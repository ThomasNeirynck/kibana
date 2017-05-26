import expect from 'expect.js';
import { find } from 'lodash';
import { Fields } from '../fields';

describe('fields', () => {

  describe('Fields', () => {

    let upstreamJson;
    beforeEach(() => {
      upstreamJson = {
        "fields": {
          "field-foo": {
            "text": {
              "type": "text",
              "searchable": true,
              "aggregatable": false
            }
          },
          "field-bar": {
            "boolean": {
              "type": "boolean",
              "searchable": true,
              "aggregatable": true
            },
            "integer": {
              "type": "integer",
              "searchable": true,
              "aggregatable": true
            }
          },
          "field-baz": {
            "_footype": {
              "type": "_footype",
              "searchable": true,
              "aggregatable": true
            }
          },
          "field-bop": {
            "integer": {
              "type": "integer",
              "searchable": true,
              "aggregatable": true
            }
          },
        }
      };
    });

    describe('fromUpstreamJSON factory method', () => {

      it(`throws an error if no 'fields' property in json`, () => {
        delete upstreamJson.fields;
        expect(Fields.fromUpstreamJSON).withArgs(upstreamJson)
          .to.throwError(/must contain a fields property/i);
      });

      it('returns correct Fields instance', () => {
        const fields = Fields.fromUpstreamJSON(upstreamJson);

        expect(fields.fields).to.be.an('array');
      });

      it('uses the first instance of a field if the same field exists in multiple mappings', () => {
        const fields = Fields.fromUpstreamJSON(upstreamJson);
        const actual = find(fields.fields, { name: 'field-bar' });

        //field-bar is defined as both a boolean and an integer, should default to
        //boolean.
        expect(actual.normalizedType).to.be('boolean');
      });

      it('defaults to the type if no normalizedType exists', () => {
        const fields = Fields.fromUpstreamJSON(upstreamJson);
        const actual = find(fields.fields, { name: 'field-foo' });

        expect(actual.normalizedType).to.be('text');
      });

      it('populates normalizedType if one exists', () => {
        const fields = Fields.fromUpstreamJSON(upstreamJson);
        const actual = find(fields.fields, { name: 'field-bop' });

        expect(actual.normalizedType).to.be('number');
      });

      it('populates all properties', () => {
        const fields = Fields.fromUpstreamJSON(upstreamJson);
        const actual = find(fields.fields, { name: 'field-foo' });
        const expected = {
          name: 'field-foo',
          type: 'text',
          normalizedType: 'text',
          searchable: true,
          aggregatable: false
        };

        expect(actual).to.eql(expected);
      });

    });

    describe('downstreamJSON getter method', () => {

      it('returns correct JSON for client', () => {
        const fields = Fields.fromUpstreamJSON(upstreamJson);
        const json = fields.downstreamJSON;

        expect(json.fields).to.eql(fields.fields);
      });

    });

  });

});

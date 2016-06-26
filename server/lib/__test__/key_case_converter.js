import expect from 'expect.js';
import { convertKeysToSnakeCaseDeep, convertKeysToCamelCaseDeep } from '../key_case_converter';

describe('key_case_converter', () => {

  let testObject;

  beforeEach(() => {
    testObject = {
      topLevelKey1: {
        innerLevelKey1: 17,
        inner_level_key2: [ 19, 31 ],
      },
      top_level_key2: {
        innerLevelKey1: 'foo_fooFoo',
        inner_level_key2: [
          { foo_bar: 29 },
          { barBar: 37 }
        ]
      }
    };
  });

  it ('convertKeysToSnakeCaseDeep should recursively convert camelCase keys to snake_case keys', () => {
    const expectedResultObject = {
      top_level_key_1: {
        inner_level_key_1: 17,
        inner_level_key_2: [ 19, 31 ],
      },
      top_level_key_2: {
        inner_level_key_1: 'foo_fooFoo',
        inner_level_key_2: [
          { foo_bar: 29 },
          { bar_bar: 37 }
        ]
      }
    };
    expect(convertKeysToSnakeCaseDeep(testObject)).to.eql(expectedResultObject);
  });

  it ('convertKeysToCamelCaseDeep should recursively convert snake_case keys to camelCase keys', () => {
    const expectedResultObject = {
      topLevelKey1: {
        innerLevelKey1: 17,
        innerLevelKey2: [ 19, 31 ],
      },
      topLevelKey2: {
        innerLevelKey1: 'foo_fooFoo',
        innerLevelKey2: [
          { fooBar: 29 },
          { barBar: 37 }
        ]
      }
    };
    expect(convertKeysToCamelCaseDeep(testObject)).to.eql(expectedResultObject);
  });

  it ('convertKeysToSnakeCaseDeep should not modify original object', () => {
    convertKeysToSnakeCaseDeep(testObject);
    expect(Object.keys(testObject)).to.contain('topLevelKey1');
    expect(Object.keys(testObject.topLevelKey1)).to.contain('innerLevelKey1');
  });

  it ('convertKeysToCamelCaseDeep should not modify original object', () => {
    convertKeysToCamelCaseDeep(testObject);
    expect(Object.keys(testObject)).to.contain('top_level_key2');
    expect(Object.keys(testObject.topLevelKey1)).to.contain('inner_level_key2');
  });
});

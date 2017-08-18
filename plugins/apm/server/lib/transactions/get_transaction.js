import { TRANSACTION_ID } from '../../../common/constants';
import { get } from 'lodash';
async function getTransaction(req) {
  const { transactionId } = req.params;
  const { start, end, client, config } = req.pre.setup;

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 1,
      query: {
        bool: {
          must: [
            {
              term: {
                [TRANSACTION_ID]: transactionId
              }
            },
            {
              range: {
                '@timestamp': {
                  gte: start,
                  lte: end,
                  format: 'epoch_millis'
                }
              }
            }
          ]
        }
      }
    }
  };
  const resp = await client('search', params);
  return get(resp, 'hits.hits[0]._source', {});
}

export default getTransaction;

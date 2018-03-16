export async function canStartTrial(req) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('admin');
  const options = {
    method: 'GET',
    path: '_xpack/license/trial_status'
  };
  try {
    const response = await callWithRequest(req, 'transport.request', options);
    const { eligible_to_start_trial } = response;
    return eligible_to_start_trial;
  } catch (error) {
    return error.body;
  }
}
export async function startTrial(req, xpackInfo) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('admin');
  const options = {
    method: 'POST',
    path: '_xpack/license/start_trial'
  };
  try {
    /*eslint camelcase: 0*/
    const response = await callWithRequest(req, 'transport.request', options);
    const { trial_was_started } = response;
    if (trial_was_started) {
      await xpackInfo.refreshNow();
    }
    return response;
  } catch (error) {
    return error.body;
  }
}

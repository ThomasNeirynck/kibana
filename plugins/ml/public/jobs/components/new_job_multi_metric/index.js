/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import './styles/main.less';
import './wizard/wizard';
import './create_job';
import uiRoutes from 'ui/routes';
uiRoutes
.defaults(/new_job_multi_metric/, {
  requireDefaultIndex: true
})
.when('/jobs/new_job_multi_metric', {
  redirectTo: '/jobs/new_job_multi_metric/step/1'
});

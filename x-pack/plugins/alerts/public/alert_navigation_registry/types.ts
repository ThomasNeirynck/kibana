/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { JsonObject } from '../../../infra/common/typed_json';
import { AlertType, SanitizedAlert } from '../../common';

export type AlertNavigationHandler = (
  alert: SanitizedAlert,
  alertType: AlertType
) => JsonObject | string;

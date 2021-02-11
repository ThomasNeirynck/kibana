/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { lazy } from 'react';
import { ValidationResult, ActionTypeModel } from '../../../../types';
import { connectorConfiguration } from './config';
import logo from './logo.svg';
import { JiraActionConnector, JiraConfig, JiraSecrets, JiraActionParams } from './types';
import * as i18n from './translations';
import { isValidUrl } from '../../../lib/value_validators';

const validateConnector = (action: JiraActionConnector): ValidationResult => {
  const validationResult = {
    errors: {
      apiUrl: new Array<string>(),
      projectKey: new Array<string>(),
      email: new Array<string>(),
      apiToken: new Array<string>(),
    },
  };
  const { errors } = validationResult;

  if (!action.config.apiUrl) {
    errors.apiUrl = [...errors.apiUrl, i18n.API_URL_REQUIRED];
  }

  if (action.config.apiUrl) {
    if (!isValidUrl(action.config.apiUrl)) {
      errors.apiUrl = [...errors.apiUrl, i18n.API_URL_INVALID];
    } else if (!isValidUrl(action.config.apiUrl, 'https:')) {
      errors.apiUrl = [...errors.apiUrl, i18n.API_URL_REQUIRE_HTTPS];
    }
  }

  if (!action.config.projectKey) {
    errors.projectKey = [...errors.projectKey, i18n.JIRA_PROJECT_KEY_REQUIRED];
  }

  if (!action.secrets.email) {
    errors.email = [...errors.email, i18n.JIRA_EMAIL_REQUIRED];
  }

  if (!action.secrets.apiToken) {
    errors.apiToken = [...errors.apiToken, i18n.JIRA_API_TOKEN_REQUIRED];
  }

  return validationResult;
};

export function getActionType(): ActionTypeModel<JiraConfig, JiraSecrets, JiraActionParams> {
  return {
    id: connectorConfiguration.id,
    iconClass: logo,
    selectMessage: i18n.JIRA_DESC,
    actionTypeTitle: connectorConfiguration.name,
    validateConnector,
    actionConnectorFields: lazy(() => import('./jira_connectors')),
    validateParams: (actionParams: JiraActionParams): ValidationResult => {
      const validationResult = { errors: {} };
      const errors = {
        summary: new Array<string>(),
        labels: new Array<string>(),
      };
      validationResult.errors = errors;
      if (
        actionParams.subActionParams &&
        actionParams.subActionParams.incident &&
        !actionParams.subActionParams.incident.summary?.length
      ) {
        errors.summary.push(i18n.SUMMARY_REQUIRED);
      }

      if (actionParams.subActionParams?.incident?.labels?.length) {
        // Jira do not allows empty spaces on labels. If the label includes a whitespace show an error.
        if (actionParams.subActionParams.incident.labels.some((label) => label.match(/\s/g)))
          errors.labels.push(i18n.LABELS_WHITE_SPACES);
      }
      return validationResult;
    },
    actionParamsFields: lazy(() => import('./jira_params')),
  };
}

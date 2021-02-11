/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SourceConfigurationFields } from '../graphql/types';

export type SourceConfiguration = SourceConfigurationFields.Fragment;

export type LogColumnConfiguration = SourceConfigurationFields.LogColumns;
export type FieldLogColumnConfiguration = SourceConfigurationFields.InfraSourceFieldLogColumnInlineFragment;
export type MessageLogColumnConfiguration = SourceConfigurationFields.InfraSourceMessageLogColumnInlineFragment;
export type TimestampLogColumnConfiguration = SourceConfigurationFields.InfraSourceTimestampLogColumnInlineFragment;

export const isFieldLogColumnConfiguration = (
  logColumnConfiguration: LogColumnConfiguration
): logColumnConfiguration is FieldLogColumnConfiguration =>
  logColumnConfiguration != null && 'fieldColumn' in logColumnConfiguration;

export const isMessageLogColumnConfiguration = (
  logColumnConfiguration: LogColumnConfiguration
): logColumnConfiguration is MessageLogColumnConfiguration =>
  logColumnConfiguration != null && 'messageColumn' in logColumnConfiguration;

export const isTimestampLogColumnConfiguration = (
  logColumnConfiguration: LogColumnConfiguration
): logColumnConfiguration is TimestampLogColumnConfiguration =>
  logColumnConfiguration != null && 'timestampColumn' in logColumnConfiguration;

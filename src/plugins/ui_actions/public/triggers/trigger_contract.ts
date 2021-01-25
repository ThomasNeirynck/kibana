/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * and the Server Side Public License, v 1; you may not use this file except in
 * compliance with, at your election, the Elastic License or the Server Side
 * Public License, v 1.
 */

import { TriggerInternal } from './trigger_internal';
import { TriggerId, TriggerContextMapping } from '../types';

/**
 * This is a public representation of a trigger that is provided to other plugins.
 */
export class TriggerContract<T extends TriggerId> {
  /**
   * Unique name of the trigger as identified in `ui_actions` plugin trigger
   * registry, such as "SELECT_RANGE_TRIGGER" or "VALUE_CLICK_TRIGGER".
   */
  public readonly id: T;

  /**
   * User friendly name of the trigger.
   */
  public readonly title?: string;

  /**
   * A longer user friendly description of the trigger.
   */
  public readonly description?: string;

  constructor(private readonly internal: TriggerInternal<T>) {
    this.id = this.internal.trigger.id;
    this.title = this.internal.trigger.title;
    this.description = this.internal.trigger.description;
  }

  /**
   * Use this method to execute action attached to this trigger.
   */
  public readonly exec = async (context: TriggerContextMapping[T], alwaysShowPopup?: boolean) => {
    await this.internal.execute(context, alwaysShowPopup);
  };
}

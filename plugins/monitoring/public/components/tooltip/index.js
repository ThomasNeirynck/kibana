import React from 'react';
import { Tooltip as PuiTooltip } from 'pivotal-ui/react/tooltip';
import { OverlayTrigger as PuiOverlayTrigger } from 'pivotal-ui/react/overlay-trigger';

export const Tooltip = props => {
  const tooltip = (
    <PuiTooltip>{ props.text }</PuiTooltip>
  );

  return (
    <PuiOverlayTrigger
      placement={props.placement}
      trigger={props.trigger}
      overlay={tooltip}
    >
      <span className="overlay-trigger">
        <span className="monitoring-tooltip__trigger">
          { props.children}
        </span>
      </span>
    </PuiOverlayTrigger>
  );
};

Tooltip.defaultProps = {
  placement: 'top',
  trigger: 'click'
};

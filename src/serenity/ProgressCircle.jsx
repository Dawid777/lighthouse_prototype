import React from 'react';
import { ProgressBar } from 'react-aria-components';

// Serenity ProgressCircle, isIndeterminate, spinning with Loop/Spin.
export function ProgressCircle({ label, isHidden }) {
  if (isHidden) return <span className="srn-progress-circle" aria-hidden="true" />;
  return (
    <ProgressBar isIndeterminate aria-label={label} className="srn-progress-circle-wrap">
      <span className="srn-progress-circle motion-loop-spin" aria-hidden="true" />
    </ProgressBar>
  );
}

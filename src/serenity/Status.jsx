import React from 'react';
import { ProgressBar as AriaProgressBar, Meter as AriaMeter, Label } from 'react-aria-components';
import { cx } from './Button.jsx';
import { Icon } from '../icons.jsx';

// Serenity Banner (variant subtle, orientation horizontal): the tone icon, the title and an optional description, on the tone's
// subtle fill with the tone's On colour. Not focusable and never moves focus (Banner § Accessibility); role="alert" only for
// danger, which reports a failure the person has to act on.
const TONE_ICON = { neutral: 'info', info: 'info', success: 'check-circle', warning: 'alert-triangle', danger: 'close-circle' };
export function Banner({ tone = 'neutral', title, children, className }) {
  return (
    <div className={cx('srn-banner', `srn-banner--${tone}`, 'motion-enter-fade', className)} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="srn-banner-icon" aria-hidden="true"><Icon name={TONE_ICON[tone]} size={20} /></span>
      <div className="srn-banner-text">
        <p className="text-body-strong-medium srn-banner-title">{title}</p>
        {children && <p className="text-body-medium srn-banner-desc">{children}</p>}
      </div>
    </div>
  );
}

// Serenity ProgressBar over the React Aria ProgressBar: the label (names the action, SR-248) over the track; isIndeterminate
// runs Loop/Slide along the track.
export function ProgressBar({ label, value, isIndeterminate = false }) {
  return (
    <AriaProgressBar value={value} isIndeterminate={isIndeterminate} className="srn-progress">
      {({ percentage }) => (
        <>
          <Label className="text-label-medium srn-progress-label">{label}</Label>
          <span className="srn-progress-track">
            <span className={cx('srn-progress-fill', isIndeterminate && 'motion-loop-slide')} style={isIndeterminate ? undefined : { width: `${percentage}%` }} />
          </span>
        </>
      )}
    </AriaProgressBar>
  );
}

// Serenity Meter (password strength): the label and the value label on one row, the track under them; the fill takes the
// status colour of the value (danger, warning, success) and says it in words too.
export function Meter({ label, value, valueLabel, tone = 'success' }) {
  return (
    <AriaMeter value={value} valueLabel={valueLabel} className="srn-meter">
      {({ percentage, valueText }) => (
        <>
          <span className="srn-meter-row">
            <Label className="text-label-medium">{label}</Label>
            <span className="text-body-medium srn-meter-value">{valueText}</span>
          </span>
          <span className="srn-progress-track"><span className={cx('srn-meter-fill', `srn-meter-fill--${tone}`, 'motion-feedback-value')} style={{ width: `${percentage}%` }} /></span>
        </>
      )}
    </AriaMeter>
  );
}

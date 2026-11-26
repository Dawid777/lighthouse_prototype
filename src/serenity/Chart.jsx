import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { cx } from './Button.jsx';
import { Value } from './Content.jsx';

// Serenity Chart: the title (label), the value and its description, then the plot. type line (tone brand: Chart/Brand/Bold,
// the one accent of the screen) or donut. No React Aria counterpart: the points and segments are buttons.
export function Chart({ id, label, value, description, children }) {
  return (
    <section className="srn-chart" aria-labelledby={`${id}-label`}>
      <div className="srn-chart-head">
        <h2 id={`${id}-label`} className="text-body-medium srn-chart-label">{label}</h2>
        <p className="srn-chart-summary">
          <span className="text-subtitle-medium num"><Value>{value}</Value></span>
          <span className="text-caption-small srn-chart-caption">{description}</span>
        </p>
      </div>
      {children}
    </section>
  );
}

// Serenity ChartTooltip: the point and its value, on hover, focus or tap.
function ChartTooltip({ x, y, children }) {
  return <div className="srn-chart-tooltip text-caption-small effect-elevation-overlay-borderless motion-enter-fade" style={{ left: x, top: y }} role="presentation">{children}</div>;
}

const useWidth = (ref) => {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return undefined;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
};

// Line plot: Stroke/Subtle grid lines, Stroke/Default baseline, Caption/Small axis labels. The plot enters with Enter/Fade
// (no Serenity pattern draws a line in). Left, Right, Home and End move between points, as a roving tab stop.
export function LinePlot({ series, min, max, format, ariaLabel }) {
  const ref = useRef(null);
  const W = useWidth(ref);
  const [active, setActive] = useState(null);
  const [focusIdx, setFocusIdx] = useState(series.length - 1);
  const btns = useRef([]);
  const H = 176, top = 8, bottom = 168, left = 32;
  const cw = W ? (W - left) / series.length : 0;
  const x = (i) => left + cw * (i + 0.5);
  const y = (v) => top + ((max - v) / (max - min)) * (bottom - top);
  const d = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(p.value).toFixed(2)}`).join(' ');
  const grid = [{ v: max, y: top, base: false }, { v: (max + min) / 2, y: (top + bottom) / 2, base: false }, { v: min, y: bottom, base: true }];

  const onKey = (e, i) => {
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? series.length - 1 : null;
    if (n !== null && n >= 0 && n < series.length) { e.preventDefault(); setFocusIdx(n); btns.current[n]?.focus(); }
  };

  return (
    <div className="srn-line motion-enter-fade">
      <div className="srn-line-plot" ref={ref} onPointerLeave={() => setActive(null)}>
        {W > 0 && (
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
            {grid.map((g) => <line key={g.v} x1={left} x2={W} y1={g.y} y2={g.y} className={g.base ? 'srn-line-base' : 'srn-line-grid'} />)}
            <path d={d} className="srn-line-path" />
            {active !== null && (
              <>
                <line x1={x(active)} x2={x(active)} y1={top} y2={bottom} className="srn-line-cursor" />
                <circle cx={x(active)} cy={y(series[active].value)} r="4" className="srn-line-dot" />
              </>
            )}
          </svg>
        )}
        {grid.map((g) => <span key={g.v} className="srn-line-y text-caption-small" style={{ top: g.y }} aria-hidden="true">{format(g.v)}</span>)}
        {W > 0 && series.map((p, i) => (
          <AriaButton
            key={p.label}
            ref={(el) => { btns.current[i] = el; }}
            aria-label={`${p.label}: ${format(p.value, true)}`}
            excludeFromTabOrder={i !== focusIdx}
            className={({ isFocusVisible }) => cx('srn-line-hit', isFocusVisible && 'effect-focus-inset-neutral')}
            style={{ left: left + cw * i, width: cw }}
            onHoverStart={() => setActive(i)}
            onFocus={() => { setActive(i); setFocusIdx(i); }}
            onBlur={() => setActive(null)}
            onPress={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
          />
        ))}
        {active !== null && W > 0 && (
          <ChartTooltip x={Math.min(Math.max(x(active), 70), W - 70)} y={y(series[active].value)}>
            <strong className="text-caption-strong-small">{format(series[active].value, true)}</strong> · {series[active].label}
          </ChartTooltip>
        )}
      </div>
      <div className="srn-line-x text-caption-small" aria-hidden="true">{series.map((p) => <span key={p.label}>{p.label}</span>)}</div>
    </div>
  );
}

// Donut with its legend: hovering, focusing or pressing a segment or a legend row highlights that category (Feedback/Hover).
export function DonutPlot({ data, total, format }) {
  const [active, setActive] = useState(null);
  const r = 74, c = 2 * Math.PI * r, gap = 2;
  let start = 0;
  const segs = data.map((s, i) => {
    const len = (c * s.pct) / 100;
    const seg = { ...s, i, dash: `${(len - gap).toFixed(2)} ${(c - len + gap).toFixed(2)}`, offset: (-start).toFixed(2) };
    start += len;
    return seg;
  });
  const on = (i) => () => setActive(i);
  const off = () => setActive(null);
  return (
    <div className="srn-donut-row">
      <div className="srn-donut" data-active={active !== null || undefined}>
        <svg viewBox="0 0 160 160" role="img" aria-label={`Spending by category: ${data.map((s) => `${s.name} ${s.pct}%`).join(', ')}`}>
          {segs.map((s) => (
            <circle key={s.name} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeDasharray={s.dash} strokeDashoffset={s.offset}
              className={cx('srn-donut-seg', 'motion-feedback-hover', active === s.i && 'is-active')} onPointerEnter={on(s.i)} onPointerLeave={off} />
          ))}
        </svg>
        <div className="srn-donut-center" aria-hidden="true">
          {active !== null && (
            <div className="motion-enter-fade">
              <span className="text-caption-small srn-donut-name">{data[active].name}</span>
              <strong className="text-body-strong-large num">{format((total * data[active].pct) / 100)}</strong>
            </div>
          )}
        </div>
      </div>
      <ul className="srn-legend" data-active={active !== null || undefined}>
        {data.map((s, i) => (
          <li key={s.name}>
            <AriaButton
              className={({ isFocusVisible }) => cx('srn-legend-item', 'text-caption-small', 'motion-feedback-hover', active === i && 'is-active', isFocusVisible && 'effect-focus-neutral')}
              onHoverStart={on(i)} onHoverEnd={off} onFocus={on(i)} onBlur={off} onPress={on(i)}
            >
              <span className="srn-legend-dot" style={{ background: s.color }} />
              <span className="srn-legend-name">{s.name}</span>
              <span className="num">{s.pct}%</span>
              <span className="lh-visually-hidden">, {format((total * s.pct) / 100)} USDC</span>
            </AriaButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

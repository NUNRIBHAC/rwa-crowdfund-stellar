// Guided campaign-page tour (CONDA S-022 pattern: tour + "Repeat tour" link).
// v2: each step scrolls its target into view and rings it with a brand
// highlight that punches through the dimming overlay, so the card is visually
// connected to the element it describes (v1 showed an unanchored modal).
// Shows once per browser (localStorage flag), then offers a repeat link.
// Steps whose target is missing are skipped, so layout changes never break it.
// Mount on the campaign detail route.
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

const SEEN_KEY = 'blockallisto-campaign-tour-seen';
const HIGHLIGHT_CLASS = 'tour-highlight';

type Step = { selector: string; title: string; body: string };

export default function CampaignTour() {
  const { m } = useI18n();
  const t = m.tour;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    let wasSeen = false;
    try {
      wasSeen = localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      wasSeen = true;
    }
    setSeen(wasSeen);
    if (!wasSeen) setOpen(true);
  }, []);

  const steps: Step[] = [
    { selector: '.fund-grid-wrap', title: t.tourStepFundingTitle, body: t.tourStepFundingBody },
    { selector: '.campaign-tabs, [role="tablist"]', title: t.tourStepTabsTitle, body: t.tourStepTabsBody },
    { selector: '.risk-warning, .risk-banner, [class*="risk"]', title: t.tourStepRiskTitle, body: t.tourStepRiskBody },
    { selector: '.campaign-news, [class*="news"], .community-section', title: t.tourStepNewsTitle, body: t.tourStepNewsBody },
  ];

  const available = steps.filter((s) => document.querySelector(s.selector));

  // Anchor the current step: scroll the target into view and ring it.
  useEffect(() => {
    if (!open) return;
    const step = available[Math.min(index, Math.max(available.length - 1, 0))];
    const el = step && (document.querySelector(step.selector) as HTMLElement | null);
    if (!el) return;
    // Honor reduced motion: instant jump instead of a smooth scroll.
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    el.classList.add(HIGHLIGHT_CLASS);
    return () => el.classList.remove(HIGHLIGHT_CLASS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  if (!open && !seen) return null;

  const close = () => {
    setOpen(false);
    setSeen(true);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode: no persistence */
    }
  };

  if (!open) {
    return (
      <button
        className="btn"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
      >
        {t.tourRepeat}
      </button>
    );
  }

  if (available.length === 0) {
    close();
    return null;
  }
  const step = available[Math.min(index, available.length - 1)];

  return (
    <div className="tour-overlay" role="dialog" aria-label={t.tourTitle}>
      <div className="tour-card">
        <h3>{step.title}</h3>
        <p className="community-note">{step.body}</p>
        <p className="community-note">{t.tourStepOf(index + 1, available.length)}</p>
        <div className="chip-row">
          {index > 0 && (
            <button className="btn" onClick={() => setIndex(index - 1)}>
              {t.tourBack}
            </button>
          )}
          {index < available.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setIndex(index + 1)}>
              {t.tourNext}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={close}>
              {t.tourDone}
            </button>
          )}
          <button className="btn" onClick={close}>
            {t.tourSkip}
          </button>
        </div>
      </div>
    </div>
  );
}

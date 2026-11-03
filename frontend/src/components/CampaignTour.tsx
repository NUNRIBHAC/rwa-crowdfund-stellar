import { tpl } from '../format';
// Guided campaign-page tour (CONDA S-022 pattern: tour + "Repeat tour" link).
// v3: step target scrolls into view and stays BRIGHT above the dim (the dim
// now comes from the target's own 9999px box-shadow, not a page-wide overlay
// tint), ringed with a brand outline. Accessible dialog: aria-modal, initial
// focus on the primary action, Tab/Shift+Tab trapped inside the card, Escape
// closes, focus restored to the invoking element on close. Background pointer
// interaction stays suppressed by the full-viewport overlay layer.
// Step selectors verified against the live campaign page (tab-bar chip row).
// Steps whose target is missing are skipped, so layout changes never break it.
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';

const SEEN_KEY = 'blockallisto-campaign-tour-seen';
const HIGHLIGHT_CLASS = 'tour-highlight';

type Step = { selector: string; title: string; body: string };

export default function CampaignTour() {
  const { m } = useI18n();
  const t = m.tour;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);

  const steps: Step[] = [
    { selector: '.fund-grid-wrap', title: t.tourStepFundingTitle, body: t.tourStepFundingBody },
    { selector: '.tab-bar, .campaign-tabs, [role="tablist"]', title: t.tourStepTabsTitle, body: t.tourStepTabsBody },
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

  // Capture the invoking element once per opening, before focus moves. For
  // auto-open there is no invoker (activeElement is body); the Repeat tour
  // button captures itself in its click handler, because by the time this
  // effect runs the button has already unmounted and focus fell back to body.
  useEffect(() => {
    if (!open) return;
    // The Repeat tour handler captures the invoker before it unmounts; only
    // fill in here when nothing was captured (auto-open: no invoker).
    if (restoreFocusRef.current == null) restoreFocusRef.current = document.activeElement;
  }, [open]);

  // Dialog behavior: initial focus, focus trap, Escape. On step change, if the
  // focused button unmounted (Next -> Done swap), pull focus back into the card.
  useEffect(() => {
    if (!open) return;
    const card = cardRef.current;
    const focusables = () => Array.from(card?.querySelectorAll<HTMLElement>('button') ?? []);
    if (!card?.contains(document.activeElement)) {
      focusables()
        .find((b) => b.className.includes('btn-primary'))
        ?.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode: no persistence */
    }
    const prev = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (prev instanceof HTMLElement && document.contains(prev)) prev.focus();
  };

  // The Repeat tour trigger stays mounted while the tour is open: focus
  // restore needs the captured invoker to still be in the document.
  const trigger = (
    <button
      className="btn"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(e) => {
        // Capture the button itself, not activeElement: a synthetic or
        // pointer click does not necessarily move focus first.
        restoreFocusRef.current = e.currentTarget;
        setIndex(0);
        setOpen(true);
      }}
    >
      {t.tourRepeat}
    </button>
  );

  if (!open) return trigger;

  if (available.length === 0) {
    close();
    return null;
  }
  const step = available[Math.min(index, available.length - 1)];

  return (
    <>
      {trigger}
      <div className="tour-overlay">
        <div className="tour-card" role="dialog" aria-modal="true" aria-label={t.tourTitle} ref={cardRef}>
          <h3>{step.title}</h3>
          <p className="community-note">{step.body}</p>
          <p className="community-note">{tpl(t.tourStepOf, { current: index + 1, total: available.length })}</p>
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
    </>
  );
}

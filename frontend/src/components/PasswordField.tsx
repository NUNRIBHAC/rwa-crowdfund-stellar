import { useId, useState } from 'react';
import { useI18n } from '../i18n';
import { passwordStrength, STRENGTH_LEVEL } from '../password-strength';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'new-password' | 'current-password';
  // Only fields that choose a new password show the strength indicator.
  showStrength?: boolean;
};

// Password input with a show/hide toggle (and an optional strength hint). The
// label is a sibling of the toggle, not its parent, so the field keeps the
// exact accessible name the label text gives it.
export default function PasswordField({ id, label, value, onChange, autoComplete, showStrength }: Props) {
  const { m } = useI18n();
  const [visible, setVisible] = useState(false);
  const strengthId = useId();
  const strength = passwordStrength(value);
  const labels = m.community.passwordStrength;
  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-row">
        <input
          type={visible ? 'text' : 'password'}
          id={id}
          name="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={showStrength ? strengthId : undefined}
          required
        />
        <button type="button" className="btn password-toggle" aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
          {visible ? m.community.passwordHide : m.community.passwordShow}
        </button>
      </div>
      {showStrength && (
        <div id={strengthId} className="password-strength" data-level={STRENGTH_LEVEL[strength]} aria-live="polite">
          <div className="password-strength-bar" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="community-note">{strength === 'empty' ? '' : labels[strength]}</p>
        </div>
      )}
    </div>
  );
}

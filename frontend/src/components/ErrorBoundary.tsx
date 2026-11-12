import { Component, type ReactNode } from 'react';
import { useI18n } from '../i18n';

function Failure() {
  const { m, locale } = useI18n();
  const textDir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <main className="page">
      <section className="panel" role="alert">
        <p dir={textDir}>{m.errors.apiFailed}</p>
        <a href="/" dir={textDir}>
          {m.nav.home}
        </a>
      </section>
    </main>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Failure /> : this.props.children;
  }
}

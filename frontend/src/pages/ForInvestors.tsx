import AssistantDocumentaryReview from '../components/AssistantDocumentaryReview';
import InvestorInformationGuide from '../components/InvestorInformationGuide';
import LossSimulator from '../components/LossSimulator';
import YieldCalculator from '../components/YieldCalculator';
import { useI18n } from '../i18n';
import { routeHash } from '../router';

// Public entry point only. Wallet positions, documents and restricted demo
// checks remain in the existing account screen, with its access controls.
export default function ForInvestors() {
  const { m } = useI18n();
  const cards = [
    { title: m.home.campaignsNav, text: m.howItWorks.investorSteps[3].text, href: routeHash({ name: 'investments' }) },
    { title: m.account.holdingsTitle, text: m.account.holdingsNote, href: `${routeHash({ name: 'account' })}#investor-holdings` },
    { title: m.account.documentsTitle, text: m.account.connectNote, href: `${routeHash({ name: 'account' })}#investor-documents` },
    { title: m.appropriateness.title, text: m.onboarding.note, href: `${routeHash({ name: 'account' })}#investor-assessment` },
  ];
  return (
    <div className="investors-page">
      <h1 className="page-title">{m.nav.forInvestors}</h1>
      <p className="investors-intro">{m.howItWorks.intro}</p>
      <div className="investors-resources">
        {cards.map((card) => (
          <section className="step-card" key={card.href}>
            <h2 className="section-title">{card.title}</h2>
            <p>{card.text}</p>
            <a className="btn" href={card.href}>
              {card.title}
            </a>
          </section>
        ))}
      </div>
      <InvestorInformationGuide />
      <AssistantDocumentaryReview />
      <YieldCalculator copy={m.yieldCalculator} />
      <LossSimulator />
      <nav className="investors-context" aria-label={m.nav.forInvestors}>
        <a className="btn" href={routeHash({ name: 'how-it-works' })}>
          {m.nav.howItWorks}
        </a>
        <a className="btn" href={routeHash({ name: 'risk-warnings' })}>
          {m.footer.riskWarnings}
        </a>
        <a className="btn" href={routeHash({ name: 'risk-disclosure' })}>
          {m.footer.riskDisclosure}
        </a>
      </nav>
    </div>
  );
}

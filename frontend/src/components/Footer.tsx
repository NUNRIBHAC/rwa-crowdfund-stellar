export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        No automatic deployment or legacy balance conversion. Existing classic intents and
        balances are preserved, not cleared. The separate identity/valuation infrastructure
        remains mock-only.
      </p>
      <p>
        Market context: the EU regulates crowdfunding under ECSPR; authorised providers are
        listed in the{' '}
        <a href="https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_upreg" target="_blank" rel="noreferrer">
          ESMA register
        </a>.
        This app is not an authorised crowdfunding service provider and lists no live offers.
      </p>
    </footer>
  );
}

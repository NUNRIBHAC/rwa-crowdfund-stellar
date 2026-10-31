export default function About() {
  return (
    <>
      <h1 className="page-title">About this project</h1>
      <p>
        Blockallisto (repository rwa-crowdfund-stellar) is a personal prototype exploring tokenized crowdfunding on the Stellar network: campaign funding
        enforced by a Soroban smart contract, with the wider platform - accounts, verification, instruments, payments - designed and documented openly in the
        repository.
      </p>
      <p>It is not a company, not an authorised crowdfunding service provider, and not an offer of securities. Market framing: Portugal to the World.</p>

      <section aria-label="Ethical exclusion policy">
        <h2 className="section-title">Ethical exclusion policy</h2>
        <p>A product-level policy for the platform this prototype explores. Issuers in the following sectors are out of scope by design:</p>
        <ul className="why-list">
          <li>Tobacco, gambling and weapons</li>
          <li>Fossil fuels, mining and nuclear power</li>
          <li>Prisons and detention services</li>
          <li>Genetically modified organisms and conflict-mineral-linked industries</li>
        </ul>
        <p>This is a design commitment for the project, not a claim about any live operation.</p>
      </section>

      <section aria-label="Technology">
        <h2 className="section-title">Technology</h2>
        <p>
          React frontend, Node backend, Soroban (Rust) contract for escrow, Freighter wallet for signing, Stellar testnet USDC. Hosting and database run on free
          tiers. Details and test reports are in the repository documentation.
        </p>
      </section>
    </>
  );
}

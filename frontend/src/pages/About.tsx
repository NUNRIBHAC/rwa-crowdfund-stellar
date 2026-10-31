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

      <section aria-label="Behind the name" className="behind-name">
        <svg className="star-accent" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M20 6 L22.5 15.5 L32 18 L22.5 20.5 L20 30 L17.5 20.5 L8 18 L17.5 15.5 Z" fill="#4B4FE2" />
          <path d="M44 28 L45.6 34.4 L52 36 L45.6 37.6 L44 44 L42.4 37.6 L36 36 L42.4 34.4 Z" fill="#8B8EF0" />
          <path d="M36 48 L37.1 52.9 L42 54 L37.1 55.1 L36 60 L34.9 55.1 L30 54 L34.9 52.9 Z" fill="#C7C8F9" />
        </svg>
        <div>
          <h2 className="behind-name-title">Behind the name</h2>
          <p>
            In Ancient Greece, Callisto became Ursa Major - a constellation where individual points of light join to form a greater, imperishable figure. At
            Blockallisto, we bring that same truth to global finance through the Stellar network. We connect small investors to fill blocks of real assets.
            Together, we are the democratization of investment: individual points coming together into a greater whole.
          </p>
        </div>
      </section>
    </>
  );
}

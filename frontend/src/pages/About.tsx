import { useI18n } from '../i18n';

export default function About() {
  const { m } = useI18n();
  return (
    <>
      <h1 className="page-title">{m.about.title}</h1>
      <div className="about-intro">
        <div>
          <p>{m.about.p1}</p>
          <p>{m.about.p2}</p>
        </div>
        <div className="about-animation">
          <img className="about-accumulation" src="https://blockallisto-media.nunrib-df6.workers.dev/animations/about-accumulation.svg" alt="" />
          <p className="community-note">{m.hero.illustration}</p>
        </div>
      </div>

      <section aria-label={m.about.ethicsAria}>
        <h2 className="section-title">{m.about.ethicsTitle}</h2>
        <p>{m.about.ethicsIntro}</p>
        <ul className="why-list">
          {m.about.ethicsPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <p>{m.about.ethicsNote}</p>
      </section>

      <section aria-label={m.about.techAria}>
        <h2 className="section-title">{m.about.techTitle}</h2>
        <p>{m.about.techText}</p>
      </section>

      <section aria-label={m.about.behindAria} className="behind-name">
        <svg className="star-accent" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M20 6 L22.5 15.5 L32 18 L22.5 20.5 L20 30 L17.5 20.5 L8 18 L17.5 15.5 Z" fill="#4B4FE2" />
          <path d="M44 28 L45.6 34.4 L52 36 L45.6 37.6 L44 44 L42.4 37.6 L36 36 L42.4 34.4 Z" fill="#8B8EF0" />
          <path d="M36 48 L37.1 52.9 L42 54 L37.1 55.1 L36 60 L34.9 55.1 L30 54 L34.9 52.9 Z" fill="#C7C8F9" />
        </svg>
        <div>
          <h2 className="behind-name-title">{m.about.behindTitle}</h2>
          <p>{m.about.behindText}</p>
        </div>
      </section>
    </>
  );
}

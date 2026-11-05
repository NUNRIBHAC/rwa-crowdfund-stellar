import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Blockallisto documentation portal - two builds from one source tree:
//   DOCS_AUDIENCE=public   (default)  -> public portal, docs/ only
//   DOCS_AUDIENCE=internal            -> private portal, docs/ + docs-internal/
// The public build never registers the internal docs instance, so internal
// content cannot leak into public HTML, search index or assets.

const isInternal = process.env.DOCS_AUDIENCE === 'internal';

const config: Config = {
  title: isInternal ? 'Blockallisto Internal Docs' : 'Blockallisto Docs',
  tagline: 'Real assets. Shared possibilities.',
  favicon: 'img/favicon.ico',

  url: 'https://docs.92-5-187-71.sslip.io',
  baseUrl: '/',

  organizationName: 'NUNRIBHAC',
  projectName: 'rwa-crowdfund-stellar',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    // Docs start English-only (repo rule: committed content in English).
    // The site UI already ships 10+ locales; doc translations can follow via
    // Weblate when wanted - not translated yet.
    locales: ['en'],
  },

  // Brand type: same Google Fonts (OFL) loading as the main site.
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@700;800&display=swap',
  ],
  headTags: [
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
    { tagName: 'link', attributes: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' } },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  plugins: isInternal
    ? [
        [
          '@docusaurus/plugin-content-docs',
          {
            id: 'internal',
            path: 'docs-internal',
            routeBasePath: 'internal',
            sidebarPath: './sidebarsInternal.ts',
          },
        ],
      ]
    : [],

  // Mermaid only exists in internal docs; the theme bundles the whole
  // mermaid library, so keep it out of the public build (weight and the
  // Render free build's memory). A public doc that ever needs a diagram must
  // move this flag back out of the conditional.
  ...(isInternal ? { markdown: { mermaid: true } } : {}),
  themes: [
    ...(isInternal ? [require.resolve('@docusaurus/theme-mermaid')] : []),
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: isInternal ? ['/docs', '/internal'] : ['/docs'],
      },
    ],
  ],

  themeConfig: {
    ...(isInternal
      ? {
          announcementBar: {
            id: 'internal-audience',
            content: 'INTERNAL DOCUMENTATION - access restricted, do not share',
            backgroundColor: '#14163A',
            textColor: '#C7C8F9',
            isCloseable: false,
          },
        }
      : {}),
    navbar: {
      title: isInternal ? 'Blockallisto Internal' : 'Blockallisto Docs',
      logo: {
        alt: 'Blockallisto',
        src: 'img/blockallisto-lockup-horizontal.svg',
        srcDark: 'img/blockallisto-lockup-horizontal-reversed.svg',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Documentation' },
        ...(isInternal
          ? [{ type: 'docSidebar' as const, sidebarId: 'internalSidebar', docsPluginId: 'internal', position: 'left' as const, label: 'Internal' }]
          : []),
        { href: 'https://demo.92-5-187-71.sslip.io', label: 'Live demo (testnet)', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright (c) ${new Date().getFullYear()} Nuno Ribeiro. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'toml', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

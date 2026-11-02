import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Platform',
      items: ['getting-started', 'architecture'],
    },
    {
      type: 'category',
      label: 'Technical',
      items: ['smart-contract', 'testing', 'deployment'],
    },
    'faq',
    'contributing',
  ],
};

export default sidebars;

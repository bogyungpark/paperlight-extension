import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'Paperlight — AI Paper Reader',
  short_name: 'Paperlight',
  description:
    'Read research papers smarter — AI explanations, translation, summaries, and chat directly on any PDF.',
  version: pkg.version,
  action: {
    default_title: 'Open Paperlight',
  },
  icons: {
    '16': 'src/assets/icons/icon-16.png',
    '32': 'src/assets/icons/icon-32.png',
    '48': 'src/assets/icons/icon-48.png',
    '128': 'src/assets/icons/icon-128.png',
  },
  permissions: ['storage', 'sidePanel', 'activeTab', 'scripting', 'contextMenus'],
  host_permissions: ['<all_urls>'],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        'src/viewer/index.html',
        'src/assets/*',
        'pdf.worker.min.mjs',
      ],
      matches: ['<all_urls>'],
    },
  ],
  options_page: 'src/options/index.html',
  commands: {
    'toggle-sidepanel': {
      suggested_key: { default: 'Ctrl+Shift+L', mac: 'Command+Shift+L' },
      description: 'Toggle Paperlight side panel',
    },
    'explain-selection': {
      suggested_key: { default: 'Ctrl+Shift+E', mac: 'Command+Shift+E' },
      description: 'Explain current selection',
    },
  },
});

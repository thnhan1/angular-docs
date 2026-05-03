import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Angular Docs',
  description: 'Tài liệu tự học Angular hiện đại (v17+) với Signals, Standalone Components và best practices.',
  base: '/angular-docs/',

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Basic',
        link: '/docs/basic/angular-component',
        activeMatch: '^/docs/basic/',
      },
      { text: 'Markdown Examples', link: '/markdown-examples' },
      { text: 'API Examples', link: '/api-examples' },
    ],

    sidebar: {
      '/docs/basic/': [
        {
          text: 'Basic',
          items: [
            { text: 'Component', link: '/docs/basic/angular-component' },
            { text: 'Templates', link: '/docs/basic/angular-templates-for-aem' },
            { text: 'Data binding', link: '/docs/basic/angular-data-binding-for-aem' },
            { text: 'Directives', link: '/docs/basic/angular-directives' },
            { text: 'Events', link: '/docs/basic/angular-events' },
            { text: 'Conditional rendering', link: '/docs/basic/angular-conditional-rendering' },
            { text: 'Listing', link: '/docs/basic/angular-listing' },
            { text: 'Forms', link: '/docs/basic/angular-form' },
            { text: 'Router', link: '/docs/basic/angular-router' },
            { text: 'Services & DI', link: '/docs/basic/angular-services-di' },
            { text: 'Http Client', link: '/docs/basic/angular-http-client' },
            { text: 'Pipe', link: '/docs/basic/angular-pipes' },
            { text: 'Lifecycle Hooks', link: '/docs/basic/angular-lifecycle-hooks' },
          ],
        },
      ],
    },
  },
})

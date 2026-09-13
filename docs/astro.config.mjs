import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightThemeNova from 'starlight-theme-nova'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Drafter',
      favicon: '/favicon.ico',
      head: [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg', sizes: 'any' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
      ],
      description: 'A small parametric modeller: sketch rectangles, extrude them, sketch on what you built.',
      customCss: ['./src/styles/custom.css'],
      plugins: [starlightThemeNova()],
      sidebar: [
        {
          label: 'Start Here',
          items: [{ slug: 'start/what-it-is' }, { slug: 'start/run-it' }, { slug: 'start/first-part' }],
        },
        {
          label: 'Modelling',
          items: [{ slug: 'model/planes-and-sketches' }, { slug: 'model/extrude-and-bodies' }, { slug: 'model/timeline' }],
        },
        {
          label: 'Sketching',
          items: [{ slug: 'sketch/tools-and-snapping' }, { slug: 'sketch/dimensions' }, { slug: 'sketch/back-faces' }],
        },
        {
          label: 'Constraints',
          items: [
            { slug: 'constraints/driven-slots' },
            { slug: 'constraints/link-tool' },
            { slug: 'constraints/parameters' },
            { slug: 'constraints/expressions' },
          ],
        },
        {
          label: 'Files',
          items: [{ slug: 'files/saving-and-export' }, { slug: 'files/format' }],
        },
        {
          label: 'Drawings',
          items: [{ slug: 'drawings/sheets' }],
        },
        {
          label: 'Development',
          items: [{ slug: 'develop/architecture' }, { slug: 'develop/testing' }, { slug: 'develop/ui-kit' }, { slug: 'develop/deployment' }],
        },
      ],
    }),
  ],
})

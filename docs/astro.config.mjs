import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightThemeNova from 'starlight-theme-nova'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Drawing',
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
          label: 'Development',
          items: [{ slug: 'develop/architecture' }, { slug: 'develop/testing' }, { slug: 'develop/ui-kit' }],
        },
      ],
    }),
  ],
})

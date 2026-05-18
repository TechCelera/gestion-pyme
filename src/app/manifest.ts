import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gestion PYME Pro',
    short_name: 'Gestion PYME',
    description: 'Sistema de Gestion Economica-Financiera para PYMEs',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#7B68EE',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}

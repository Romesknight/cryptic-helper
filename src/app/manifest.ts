import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cryptic Helper - AI Cryptic Crossword Solver',
    short_name: 'Cryptic Helper',
    description:
      'Get AI-powered hints and answers for cryptic crossword clues with detailed wordplay annotations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#059669',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

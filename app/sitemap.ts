import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
      images: [`${SITE_URL}/images/og-image.png`],
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}

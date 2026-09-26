import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/blog';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${site.name} — Articles`,
    description: 'Articles on .NET, identity and SSO, integration, web performance and AI tooling.',
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}

import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

const byDateDesc = (a: Post, b: Post) => b.data.date.valueOf() - a.data.date.valueOf();

/** Posts that are live: used for the sitemap, RSS, navigation and production pages. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft && !data.outline);
  return posts.sort(byDateDesc);
}

/** Posts to render as pages: everything (drafts, outlines) while developing, only published in production. */
export async function getRenderablePosts(): Promise<Post[]> {
  if (!import.meta.env.DEV) return getPublishedPosts();
  return (await getCollection('blog')).sort(byDateDesc);
}

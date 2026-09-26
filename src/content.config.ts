import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    /** The article headline (<h1>). */
    title: z.string().max(70),
    /** Optional shorter <title> for search results (max 60). Defaults to the headline plus the site name when that fits. */
    seoTitle: z.string().max(60).optional(),
    /** Aim for 120–155 characters: it becomes the meta description. */
    description: z.string().min(70).max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Safe default: a post is unpublished until it sets `draft: false`. */
    draft: z.boolean().default(true),
    /** Outlines are writing prompts for the author, never rendered as articles. */
    outline: z.boolean().default(false),
  }),
});

export const collections = { blog };

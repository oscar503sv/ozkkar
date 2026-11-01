import { getCollection, type CollectionEntry } from 'astro:content';

import { CATEGORY_ICONS } from '../data/project-categories';

export type ProjectEntry = CollectionEntry<'projects'>;

/** Published projects sorted by `order`, then name. */
export async function getProjects(): Promise<ProjectEntry[]> {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  return projects.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name),
  );
}

export function projectIcon(project: ProjectEntry): string {
  return project.data.icon ?? CATEGORY_ICONS[project.data.categories[0]!];
}

/** Best URL for a whole-card link: repository, then live site, then download. */
export function projectUrl(project: ProjectEntry): string | undefined {
  return project.data.repo ?? project.data.live ?? project.data.download;
}

/** Resolve a /public asset under the deployment base path (GitHub Pages sub-path aware). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

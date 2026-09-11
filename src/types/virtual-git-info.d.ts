// Backs `vite-plugins/dev-git-info.ts`'s virtual module -- only resolvable
// under the Vite dev server, never during `vite build`.
declare module 'virtual:git-info' {
  export const commitSha: string;
  export const dirty: boolean;
}

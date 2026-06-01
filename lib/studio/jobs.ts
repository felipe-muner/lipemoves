import type { Job } from "./types"

// In-memory job store. Lives in the Node process running `next dev` / `next
// start`, which is exactly where the rendering happens locally. Kept on
// globalThis so it survives Hot Module Reload in dev.
declare global {
  // eslint-disable-next-line no-var
  var __studioJobs: Map<string, Job> | undefined
}

const store: Map<string, Job> = (globalThis.__studioJobs ??= new Map<
  string,
  Job
>())

export function putJob(job: Job): void {
  store.set(job.id, job)
}

export function getJob(id: string): Job | undefined {
  return store.get(id)
}

export function updateJob(id: string, patch: Partial<Job>): void {
  const job = store.get(id)
  if (job) store.set(id, { ...job, ...patch })
}

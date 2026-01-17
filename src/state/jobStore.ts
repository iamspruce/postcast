import fs from "fs/promises";
import path from "path";

export type JobInfo = {
    jobId: string;
    fingerprint: string;
    startedAt: string;
    status: "pending" | "completed" | "failed";
    audioUrl?: string;
};

const jobStorePath = path.join(process.cwd(), "data", "jobs.json");

export async function loadJobs(): Promise<Record<string, JobInfo>> {
    try {
        const raw = await fs.readFile(jobStorePath, "utf8");
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

export async function saveJob(info: JobInfo): Promise<void> {
    const jobs = await loadJobs();
    jobs[info.fingerprint] = info;
    await fs.mkdir(path.dirname(jobStorePath), { recursive: true });
    await fs.writeFile(jobStorePath, JSON.stringify(jobs, null, 2));
}

export async function findJobByFingerprint(fingerprint: string): Promise<JobInfo | undefined> {
    const jobs = await loadJobs();
    return jobs[fingerprint];
}

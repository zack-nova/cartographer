import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runGit(
  cwd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("git", args, {
    cwd,
  });
}

export async function runGitOrNull(
  cwd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string } | null> {
  try {
    return await runGit(cwd, args);
  } catch {
    return null;
  }
}

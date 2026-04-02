import { execFile } from "node:child_process";
import { mkdtemp, mkdir, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const gitEnv = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: "1",
  HOME: "",
  XDG_CONFIG_HOME: "",
};

export async function createTempDirectory(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

export async function writeRepoFiles(
  rootDir: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(rootDir, relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
  }
}

export async function runGit(
  cwd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("git", args, {
    cwd,
    env: gitEnv,
  });
}

export async function initializeGitRepository(
  files: Record<string, string>,
): Promise<{ repoDir: string; initialCommit: string }> {
  const repoDir = await createTempDirectory("cartographer-repo-");

  await runGit(repoDir, ["init", "--initial-branch=main"]);
  await runGit(repoDir, ["config", "user.name", "Cartographer Tests"]);
  await runGit(repoDir, ["config", "user.email", "cartographer@example.com"]);
  await writeRepoFiles(repoDir, files);
  await runGit(repoDir, ["add", "."]);
  await runGit(repoDir, ["commit", "-m", "initial"]);

  const { stdout } = await runGit(repoDir, ["rev-parse", "HEAD"]);
  const canonicalRepoDir = await realpath(repoDir);

  return {
    repoDir: canonicalRepoDir,
    initialCommit: stdout.trim(),
  };
}

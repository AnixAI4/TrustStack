/**
 * free-port.mjs - make sure the dev server always gets the same port.
 *
 * Terminates ONLY the Node/Next process that is listening on the given TCP
 * port (default 3000), then waits until the port is actually free. This stops
 * an old copy of the project (or a stale server in another window) from
 * squatting on the port and making `npm run dev` silently fall back to 3001 - * which is what makes the browser show an out-of-date version.
 *
 * Safe by design: it never blanket-kills node, only the process bound to the
 * port, and it leaves non-node processes alone.
 *
 * Usage: node scripts/free-port.mjs [port]
 */
import { execSync } from "node:child_process";

const port = String(process.argv[2] ?? "3000");
const isWin = process.platform === "win32";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

function sleep(ms) {
  // Synchronous sleep without extra deps.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** PIDs of processes LISTENING on the port. */
function listenerPids(p) {
  const pids = new Set();
  try {
    if (isWin) {
      const out = run("netstat -ano -p tcp");
      for (const line of out.split(/\r?\n/)) {
        if (!/LISTENING/i.test(line)) continue;
        const m = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
        if (m && m[1] === p) pids.add(m[2]);
      }
    } else {
      const out = run(`lsof -ti tcp:${p} -sTCP:LISTEN`);
      out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((x) => pids.add(x));
    }
  } catch {
    // Command found nothing / failed -> treat as no listeners.
  }
  return [...pids];
}

/** Only kill node processes, so we never nuke an unrelated service. */
function isNode(pid) {
  try {
    if (isWin) {
      return /"node\.exe"/i.test(run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`));
    }
    return /node/i.test(run(`ps -p ${pid} -o comm=`));
  } catch {
    return false;
  }
}

function kill(pid) {
  if (isWin) run(`taskkill /PID ${pid} /F /T`);
  else process.kill(Number(pid), "SIGKILL");
}

const pids = listenerPids(port);
if (pids.length === 0) {
  console.log(`[free-port] port ${port} already free`);
  process.exit(0);
}

for (const pid of pids) {
  if (!isNode(pid)) {
    console.warn(
      `[free-port] port ${port} is held by non-node PID ${pid}; leaving it alone. ` +
        `Free it manually if you want this project on ${port}.`,
    );
    continue;
  }
  try {
    kill(pid);
    console.log(`[free-port] freed port ${port} (stopped node PID ${pid})`);
  } catch (e) {
    console.warn(`[free-port] could not stop PID ${pid}: ${e.message}`);
  }
}

// Wait for the socket to actually release before Next tries to bind it.
for (let i = 0; i < 15 && listenerPids(port).length > 0; i++) {
  sleep(200);
}

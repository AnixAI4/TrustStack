import { spawn } from "node:child_process";
import { createServer } from "node:net";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROUTES = {
  industries: {
    path: "/industries",
    marker: "[data-industry-models]",
    stateAttribute: "data-model-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    captureAllReducedStates: true,
  },
  tools: {
    path: "/tools",
    marker: "[data-tools-console]",
    stateAttribute: "data-tool-index",
    stateCount: 2,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-tool-assembly]",
    captureAllReducedStates: true,
  },
  blog: {
    path: "/blog",
    marker: "[data-editorial-press]",
    stateAttribute: "data-topic-index",
    stateCount: 5,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-press-chassis], [data-press-base], [data-press-controls]",
    captureAllReducedStates: true,
  },
  solutions: {
    path: "/solutions",
    marker: "[data-service-stack]",
    stateAttribute: "data-service-index",
    stateCount: 7,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-service-chassis]",
    captureAllReducedStates: true,
  },
  scanner: {
    path: "/scanner",
    marker: "[data-scanner-gantry]",
    stateAttribute: "data-signal-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-scanner-assembly]",
    captureAllReducedStates: true,
  },
  security: {
    path: "/security",
    marker: "[data-security-fortress]",
    stateAttribute: "data-control-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-security-assembly]",
    captureAllReducedStates: true,
  },
  templates: {
    path: "/templates",
    marker: "[data-template-archive]",
    stateAttribute: "data-drawer-index",
    stateCount: 4,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-archive-assembly]",
    captureAllReducedStates: true,
  },
  rules: {
    path: "/rules",
    marker: "[data-rules-index]",
    stateAttribute: "data-category-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-rules-assembly]",
    captureAllReducedStates: true,
  },
  act: {
    path: "/act",
    marker: "[data-act-codex]",
    stateAttribute: "data-chapter-index",
    stateCount: 9,
    stageSelector: ".route-hero-stage",
    controlSelector: '[aria-label="Act chapters"] button',
    selectedSelector: '[aria-label="Act chapters"] button[aria-pressed="true"]',
    railSelector: '[aria-label="Act chapters"]',
    captureAllReducedStates: true,
  },
  cases: {
    path: "/cases",
    marker: "[data-case-balance]",
    stateAttribute: "data-case-index",
    stateCount: 4,
    stageSelector: ".route-hero-stage",
    maxCopyGap: 20,
    captureAllReducedStates: true,
  },
  courses: {
    path: "/courses",
    marker: "[data-course-router]",
    stateAttribute: "data-track-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    captureAllReducedStates: true,
  },
  "why-us": {
    path: "/why-us",
    marker: "[data-integration-core]",
    stateAttribute: "data-proof-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    captureAllReducedStates: true,
  },
  certification: {
    path: "/certification",
    marker: "[data-credential-press]",
    stateAttribute: "data-module-index",
    stateCount: 8,
    stageSelector: ".route-hero-stage",
    captureAllReducedStates: true,
  },
  learn: {
    path: "/learn",
    marker: "[data-learning-path]",
    stateAttribute: "data-step-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    captureAllReducedStates: true,
  },
  rights: {
    path: "/rights",
    marker: "[data-rights-wheel]",
    stateAttribute: "data-right-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    captureAllReducedStates: true,
  },
  framework: {
    path: "/framework",
    marker: "[data-framework-method]",
    stateCount: 1,
    stageSelector: ".route-hero-stage",
    modelSelector: "[data-method-architecture] > div",
    static: true,
  },
  privacy: {
    path: "/privacy",
    marker: "[data-privacy-vault]",
    stateAttribute: "data-item-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    legal: true,
    captureAllReducedStates: true,
  },
  terms: {
    path: "/terms",
    marker: "[data-terms-ledger]",
    stateAttribute: "data-item-index",
    stateCount: 6,
    stageSelector: ".route-hero-stage",
    legal: true,
    captureAllReducedStates: true,
  },
  cookies: {
    path: "/cookies",
    marker: "[data-consent-console]",
    stateAttribute: "data-item-index",
    stateCount: 4,
    stageSelector: ".route-hero-stage",
    legal: true,
    captureAllReducedStates: true,
  },
};

const VIEWPORTS = {
  desktop: { width: 1366, height: 768, mobile: false },
  standard: { width: 1280, height: 800, mobile: false },
  wide: { width: 1440, height: 1000, mobile: false },
  tablet: { width: 1024, height: 768, mobile: false },
  mobile: { width: 390, height: 844, mobile: true },
};

function parseArgs(argv) {
  const values = {
    route: "industries",
    phase: "before",
    baseUrl: "http://127.0.0.1:3000",
    outDir: "",
    quick: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--route") values.route = argv[++index];
    else if (argument === "--phase") values.phase = argv[++index];
    else if (argument === "--base-url") values.baseUrl = argv[++index];
    else if (argument === "--out-dir") values.outDir = argv[++index];
    else if (argument === "--quick") values.quick = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!ROUTES[values.route]) {
    throw new Error(`Unsupported route: ${values.route}`);
  }
  if (!/^[a-z0-9-]+$/i.test(values.phase)) {
    throw new Error(`Invalid phase label: ${values.phase}`);
  }

  values.outDir = values.outDir
    ? resolve(values.outDir)
    : join(tmpdir(), "truststack-hero-audit", values.route, values.phase);
  return values;
}

function findChromium() {
  const candidates = [
    process.env.PROGRAMFILES &&
      join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["PROGRAMFILES(X86)"] &&
      join(process.env["PROGRAMFILES(X86)"], "Microsoft", "Edge", "Application", "msedge.exe"),
    process.env.PROGRAMFILES &&
      join(process.env.PROGRAMFILES, "Microsoft", "Edge", "Application", "msedge.exe"),
    process.env.LOCALAPPDATA &&
      join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "Application", "msedge.exe"),
    process.env.PROGRAMFILES &&
      join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (candidate && requireExists(candidate)) return candidate;
    } catch {
      // Continue through the known browser locations.
    }
  }
  throw new Error("No installed Edge or Chrome executable was found.");
}

function requireExists(path) {
  try {
    return Boolean(process.getBuiltinModule("node:fs").statSync(path).isFile());
  } catch {
    return false;
  }
}

async function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolvePort(address.port));
    });
  });
}

async function retry(operation, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    }
  }
  throw lastError ?? new Error("Operation timed out.");
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolveReady, reject) => {
      this.socket.addEventListener("open", resolveReady, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
      return;
    }

    const eventWaiters = this.waiters.get(message.method) ?? [];
    this.waiters.delete(message.method);
    for (const waiter of eventWaiters) waiter.resolve(message.params);
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolveRequest, reject) => {
      this.pending.set(id, { resolve: resolveRequest, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForEvent(method, timeoutMs = 30_000) {
    return new Promise((resolveEvent, reject) => {
      const waiter = { resolve: resolveEvent, reject };
      const eventWaiters = this.waiters.get(method) ?? [];
      eventWaiters.push(waiter);
      this.waiters.set(method, eventWaiters);
      const timer = setTimeout(() => {
        const current = this.waiters.get(method) ?? [];
        this.waiters.set(
          method,
          current.filter((item) => item !== waiter)
        );
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      waiter.resolve = (value) => {
        clearTimeout(timer);
        resolveEvent(value);
      };
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(
      response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text ??
        "Browser evaluation failed."
    );
  }
  return response.result.value;
}

async function waitForExpression(client, expression, timeoutMs = 30_000) {
  return retry(async () => {
    const result = await evaluate(client, expression);
    if (!result) throw new Error(`Condition not met: ${expression}`);
    return result;
  }, timeoutMs);
}

async function navigate(client, url) {
  const result = await client.send("Page.navigate", { url });
  if (result.errorText) throw new Error(`Navigation failed: ${result.errorText}`);
  await waitForExpression(
    client,
    `location.href === ${JSON.stringify(url)} && document.readyState !== "loading"`,
    120_000
  );
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
  await client.send("Emulation.setTouchEmulationEnabled", {
    enabled: viewport.mobile,
    maxTouchPoints: viewport.mobile ? 5 : 1,
  });
}

async function setReducedMotion(client, reduced) {
  await client.send("Emulation.setEmulatedMedia", {
    features: [
      {
        name: "prefers-reduced-motion",
        value: reduced ? "reduce" : "no-preference",
      },
    ],
  });
}

async function setLocaleCookie(client, baseUrl, locale) {
  const result = await client.send("Network.setCookie", {
    name: "NEXT_LOCALE",
    value: locale,
    url: baseUrl,
    sameSite: "Lax",
  });
  if (!result.success) throw new Error(`Could not set locale cookie to ${locale}.`);
}

function metricsExpression(config) {
  return `(() => {
    const hero = document.querySelector(${JSON.stringify(config.marker)});
    if (!hero) return null;
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: Number(rect.x.toFixed(1)),
        y: Number(rect.y.toFixed(1)),
        width: Number(rect.width.toFixed(1)),
        height: Number(rect.height.toFixed(1)),
        right: Number(rect.right.toFixed(1)),
        bottom: Number(rect.bottom.toFixed(1)),
      };
    };
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" &&
        style.visibility !== "hidden" && Number(style.opacity) > 0;
    };
    const unionBounds = (elements) => {
      const rects = elements.filter(visible).map((element) => element.getBoundingClientRect());
      if (rects.length === 0) return null;
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return {
        x: Number(left.toFixed(1)),
        y: Number(top.toFixed(1)),
        width: Number((right - left).toFixed(1)),
        height: Number((bottom - top).toFixed(1)),
        right: Number(right.toFixed(1)),
        bottom: Number(bottom.toFixed(1)),
      };
    };
    const stage = hero.querySelector(${JSON.stringify(config.stageSelector)});
    const modelElements = stage
      ? [...stage.querySelectorAll(${JSON.stringify(config.modelSelector ?? ":scope > div")})]
      : [];
    const model = modelElements[0] ?? null;
    const modelBounds = modelElements.length > 1 ? (() => {
      const rects = modelElements.map((element) => element.getBoundingClientRect());
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return {
        x: Number(left.toFixed(1)),
        y: Number(top.toFixed(1)),
        width: Number((right - left).toFixed(1)),
        height: Number((bottom - top).toFixed(1)),
        right: Number(right.toFixed(1)),
        bottom: Number(bottom.toFixed(1)),
      };
    })() : box(model);
    const rail = hero.querySelector(${JSON.stringify(config.railSelector ?? ".route-hero-tabs")});
    const grid = hero.querySelector(".route-hero-grid");
    const inner = hero.querySelector(".route-hero-inner");
    const copy = grid?.firstElementChild ?? null;
    const copyBlocks = copy ? [...copy.querySelectorAll(
      ":scope > p, :scope > h1, :scope > [aria-live] > *"
    )].filter(visible).sort((left, right) =>
      left.getBoundingClientRect().top - right.getBoundingClientRect().top
    ) : [];
    const copyBounds = unionBounds(copyBlocks);
    const copyGaps = copyBlocks.slice(1).map((element, index) => Math.max(
      0,
      element.getBoundingClientRect().top - copyBlocks[index].getBoundingClientRect().bottom
    ));
    const structuralArtwork = stage ? [...stage.querySelectorAll("*")].filter((element) => {
      if (!visible(element)) return false;
      const style = getComputedStyle(element);
      const borderWidth = ["Top", "Right", "Bottom", "Left"].reduce(
        (total, side) => total + Number.parseFloat(style[\`border\${side}Width\`] || "0"),
        0
      );
      const hasBackground = style.backgroundImage !== "none" ||
        !["rgba(0, 0, 0, 0)", "transparent"].includes(style.backgroundColor);
      const isSvgPrimitive = /^(PATH|LINE|RECT|CIRCLE|ELLIPSE|POLYGON|POLYLINE|TEXT)$/i
        .test(element.tagName);
      const hasOwnText = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
      );
      return borderWidth > 0 || hasBackground || isSvgPrimitive || hasOwnText;
    }) : [];
    const artworkBounds = unionBounds(structuralArtwork);
    let firstSection = hero.nextElementSibling;
    while (firstSection && !firstSection.matches("section, .section")) {
      firstSection = firstSection.nextElementSibling;
    }
    const firstMeaningful = firstSection?.querySelector(
      "a[href], article, form, .card, [class*='rounded']"
    ) ?? firstSection?.firstElementChild ?? null;
    const firstMeaningfulBounds = box(firstMeaningful);
    const gridBounds = box(grid);
    const stageBounds = box(stage);
    const firstContentVisible = firstMeaningfulBounds ? Math.max(
      0,
      Math.min(window.innerHeight, firstMeaningfulBounds.bottom) -
        Math.max(0, firstMeaningfulBounds.y)
    ) : 0;
    const stageRect = stage?.getBoundingClientRect();
    const outsideStage = stageRect ? [...stage.querySelectorAll("*")]
      .filter((element) => {
        if (!visible(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < stageRect.left - 1 || rect.right > stageRect.right + 1 ||
          rect.top < stageRect.top - 1 || rect.bottom > stageRect.bottom + 1;
      })
      .slice(0, 20)
      .map((element) => ({
        tag: element.tagName,
        className: String(element.className).slice(0, 100),
        bounds: box(element),
      })) : [];
    const zeroOpacityEssential = [...hero.querySelectorAll("h1, [aria-live], [role=tabpanel], [data-industry-model]")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && Number(getComputedStyle(element).opacity) === 0;
      })
      .map((element) => ({ tag: element.tagName, className: String(element.className).slice(0, 100) }));
    const data = Object.fromEntries([...hero.attributes]
      .filter((attribute) => attribute.name.startsWith("data-"))
      .map((attribute) => [attribute.name, attribute.value]));
    return {
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      },
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      theme: document.documentElement.getAttribute("data-theme"),
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      data,
      selectedTabs: hero.querySelectorAll(${JSON.stringify(config.selectedSelector ?? '[role="tab"][aria-selected="true"]')}).length,
      selectedLabel: hero.querySelector(${JSON.stringify(config.selectedSelector ?? '[role="tab"][aria-selected="true"]')})?.textContent?.trim() ?? "",
      tabCount: hero.querySelectorAll(${JSON.stringify(config.controlSelector ?? '[role="tab"]')}).length,
      visibleLiveRegions: [...hero.querySelectorAll("[aria-live]")].filter(visible).length,
      zeroOpacityEssential,
      hero: box(hero),
      inner: box(inner),
      grid: box(grid),
      copy: box(copy),
      copyBounds,
      h1: box(copy?.querySelector("h1")),
      stage: box(stage),
      artworkBounds,
      model: modelBounds,
      rail: box(rail),
      firstSection: box(firstSection),
      firstMeaningful: firstMeaningfulBounds,
      derived: {
        copyOccupancyY: copyBounds && gridBounds
          ? Number((copyBounds.height / gridBounds.height).toFixed(3))
          : null,
        artworkOccupancyX: artworkBounds && stageBounds
          ? Number((artworkBounds.width / stageBounds.width).toFixed(3))
          : null,
        artworkOccupancyY: artworkBounds && stageBounds
          ? Number((artworkBounds.height / stageBounds.height).toFixed(3))
          : null,
        largestCopyGap: Number(Math.max(0, ...copyGaps).toFixed(1)),
        copyTopUnused: copyBounds && gridBounds
          ? Number((copyBounds.y - gridBounds.y).toFixed(1))
          : null,
        copyBottomUnused: copyBounds && gridBounds
          ? Number((gridBounds.bottom - copyBounds.bottom).toFixed(1))
          : null,
        firstContentVisible: Number(firstContentVisible.toFixed(1)),
        heroViewportShare: Number((hero.getBoundingClientRect().height / window.innerHeight).toFixed(3)),
      },
      outsideStage,
    };
  })()`;
}

async function capturePng(client, filePath, clip = null) {
  const response = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: Boolean(clip),
    ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
  });
  await writeFile(filePath, Buffer.from(response.data, "base64"));
}

async function captureHero(client, config, filePath) {
  const clip = await evaluate(
    client,
    `(() => { const rect = document.querySelector(${JSON.stringify(config.marker)}).getBoundingClientRect(); return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height }; })()`
  );
  await capturePng(client, filePath, clip);
}

async function configurePage(client, options, config, sample) {
  await setViewport(client, sample.viewport);
  await setReducedMotion(client, sample.reducedMotion);
  await setLocaleCookie(client, options.baseUrl, sample.locale);
  const url = `${options.baseUrl}${config.path}?hero-audit=${options.phase}-${Date.now()}`;
  await navigate(client, url);
  await evaluate(
    client,
    `(() => {
      localStorage.setItem("dpdp-consent", JSON.stringify({ v: "2025-06", cats: { essential: true } }));
      localStorage.setItem("theme", ${JSON.stringify(sample.theme)});
      document.documentElement.setAttribute("data-theme", ${JSON.stringify(sample.theme)});
      return true;
    })()`
  );
  await navigate(client, url);
  await waitForExpression(
    client,
    `(() => { const element = document.querySelector(${JSON.stringify(config.marker)}); return Boolean(element && element.getBoundingClientRect().width > 0); })()`
  );
  await waitForExpression(
    client,
    `document.documentElement.lang === ${JSON.stringify(sample.locale)}`
  );
  await evaluate(
    client,
    `document.documentElement.setAttribute("data-theme", ${JSON.stringify(sample.theme)})`
  );
}

async function selectState(client, config, index) {
  if (config.static) return;
  await retry(async () => {
    const selected = await evaluate(
      client,
      `(() => {
        const hero = document.querySelector(${JSON.stringify(config.marker)});
        const tabs = hero?.querySelectorAll(${JSON.stringify(config.controlSelector ?? '[role="tab"]')});
        tabs?.[${index}]?.click();
        return hero?.getAttribute(${JSON.stringify(config.stateAttribute)}) ?? "";
      })()`
    );
    if (selected !== String(index)) {
      throw new Error(`State ${index} has not committed yet.`);
    }
  }, 30_000);
  await evaluate(
    client,
    "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))"
  );
}

async function createContactSheet(client, imagePaths, outputPath, title) {
  const figures = [];
  for (let index = 0; index < imagePaths.length; index += 1) {
    const image = await readFile(imagePaths[index]);
    figures.push(`<figure><img src="data:image/png;base64,${image.toString("base64")}" alt=""><figcaption>State ${String(index + 1).padStart(2, "0")}</figcaption></figure>`);
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:24px;background:#181714;color:#f4efe7;font-family:Arial,sans-serif}
    h1{margin:0 0 18px;font-size:24px;letter-spacing:0}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    figure{margin:0;border:1px solid #49453d;background:#23211d}img{display:block;width:100%;height:auto}figcaption{padding:9px 12px;font-size:14px;font-weight:700}
  </style></head><body><h1>${title}</h1><main>${figures.join("")}</main></body></html>`;
  const htmlPath = join(resolve(outputPath, ".."), ".contact-sheet.html");
  await writeFile(htmlPath, html, "utf8");
  try {
    await setViewport(client, { width: 1800, height: 1200, mobile: false });
    await navigate(client, pathToFileURL(htmlPath).href);
    await waitForExpression(client, "[...document.images].every((image) => image.complete)");
    const height = await evaluate(client, "Math.ceil(document.documentElement.scrollHeight)");
    await capturePng(client, outputPath, {
      x: 0,
      y: 0,
      width: 1800,
      height,
    });
  } finally {
    await rm(htmlPath, { force: true });
  }
}

async function runAudit(client, options, config) {
  const report = {
    route: config.path,
    phase: options.phase,
    quick: options.quick,
    createdAt: new Date().toISOString(),
    outputDirectory: options.outDir,
    states: [],
    reducedStates: [],
    matrix: [],
  };
  const stateImages = [];
  const reducedStateImages = [];

  const defaultSample = {
    viewport: VIEWPORTS.desktop,
    theme: "light",
    locale: "en",
    reducedMotion: false,
  };
  await configurePage(client, options, config, defaultSample);
  const normalStateCount = options.quick ? 1 : config.stateCount;
  for (let index = 0; index < normalStateCount; index += 1) {
    await selectState(client, config, index);
    const filePath = join(
      options.outDir,
      `${options.route}-${options.phase}-state-${String(index + 1).padStart(2, "0")}.png`
    );
    await captureHero(client, config, filePath);
    stateImages.push(filePath);
    report.states.push({
      index,
      screenshot: basename(filePath),
      metrics: await evaluate(client, metricsExpression(config)),
    });
  }

  if (!options.quick && config.captureAllReducedStates) {
    const reducedSample = { ...defaultSample, reducedMotion: true };
    await configurePage(client, options, config, reducedSample);
    for (let index = 0; index < config.stateCount; index += 1) {
      await selectState(client, config, index);
      const filePath = join(
        options.outDir,
        `${options.route}-${options.phase}-reduced-state-${String(index + 1).padStart(2, "0")}.png`
      );
      await captureHero(client, config, filePath);
      reducedStateImages.push(filePath);
      report.reducedStates.push({
        index,
        screenshot: basename(filePath),
        metrics: await evaluate(client, metricsExpression(config)),
      });
    }
  }

  const matrixSamples = [
    { name: "standard-light", viewport: VIEWPORTS.standard, theme: "light", locale: "en", reducedMotion: false },
    { name: "wide-light", viewport: VIEWPORTS.wide, theme: "light", locale: "en", reducedMotion: false },
    { name: "tablet-light", viewport: VIEWPORTS.tablet, theme: "light", locale: "en", reducedMotion: false },
    { name: "mobile-light", viewport: VIEWPORTS.mobile, theme: "light", locale: "en", reducedMotion: false },
    { name: "desktop-dark", viewport: VIEWPORTS.desktop, theme: "dark", locale: "en", reducedMotion: false },
    { name: "desktop-reduced", viewport: VIEWPORTS.desktop, theme: "light", locale: "en", reducedMotion: true },
    { name: "desktop-hi", viewport: VIEWPORTS.desktop, theme: "light", locale: "hi", reducedMotion: false },
    { name: "desktop-ml", viewport: VIEWPORTS.desktop, theme: "light", locale: "ml", reducedMotion: false },
    { name: "desktop-ur", viewport: VIEWPORTS.desktop, theme: "light", locale: "ur", reducedMotion: false },
  ];

  for (const sample of options.quick ? [] : matrixSamples) {
    await configurePage(client, options, config, sample);
    await selectState(client, config, 0);
    const filePath = join(options.outDir, `${options.route}-${options.phase}-${sample.name}.png`);
    await capturePng(client, filePath);
    report.matrix.push({
      name: sample.name,
      screenshot: basename(filePath),
      metrics: await evaluate(client, metricsExpression(config)),
    });
  }

  const contactSheet = join(
    options.outDir,
    `${options.route}-${options.phase}-states-contact-sheet.png`
  );
  await createContactSheet(
    client,
    stateImages,
    contactSheet,
    `${config.path} · ${options.phase} · 1366 × 768 · light`
  );
  report.contactSheet = basename(contactSheet);
  if (reducedStateImages.length > 0) {
    const reducedContactSheet = join(
      options.outDir,
      `${options.route}-${options.phase}-reduced-states-contact-sheet.png`
    );
    await createContactSheet(
      client,
      reducedStateImages,
      reducedContactSheet,
      `${config.path} · ${options.phase} · reduced motion · 1366 × 768 · light`
    );
    report.reducedContactSheet = basename(reducedContactSheet);
  }
  await writeFile(
    join(options.outDir, `${options.route}-${options.phase}-report.json`),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  const samples = [...report.states, ...report.reducedStates, ...report.matrix];
  report.failures = samples.flatMap((sample) => {
    const metrics = sample.metrics;
    const failures = [];
    const mobile = metrics.viewport.innerWidth < 1024;
    const hasRail = Boolean(metrics.rail);
    const heroLimit = config.legal ? 320 : hasRail ? 400 : 360;
    if (metrics.viewport.scrollWidth > metrics.viewport.innerWidth + 1) failures.push("horizontal-overflow");
    if (!mobile && metrics.hero.height > heroLimit + 1) failures.push("hero-height");
    if (!mobile && metrics.derived.copyOccupancyY !== null && metrics.derived.copyOccupancyY < 0.68) failures.push("copy-occupancy");
    if (!mobile && metrics.derived.artworkOccupancyX !== null && metrics.derived.artworkOccupancyX < 0.72) failures.push("artwork-occupancy-x");
    if (!mobile && metrics.derived.artworkOccupancyY !== null && metrics.derived.artworkOccupancyY < 0.72) failures.push("artwork-occupancy-y");
    if (!mobile && metrics.derived.firstContentVisible < 180) failures.push("first-content-visible");
    if (metrics.derived.largestCopyGap > (config.maxCopyGap ?? 28)) failures.push("copy-gap");
    if (metrics.selectedTabs !== (config.static ? 0 : 1)) failures.push("selected-control-count");
    if (metrics.outsideStage.length > 0) failures.push("artwork-outside-stage");
    if (mobile && metrics.stage?.height > 0) failures.push("mobile-stage-height");
    return failures.length > 0 ? [{ sample: sample.name ?? sample.index, failures }] : [];
  });
  await writeFile(
    join(options.outDir, `${options.route}-${options.phase}-report.json`),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  return report;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = ROUTES[options.route];
  await mkdir(options.outDir, { recursive: true });

  const browserPath = findChromium();
  const port = await getFreePort();
  const profile = await mkdtemp(join(tmpdir(), "truststack-hero-cdp-"));
  const browser = spawn(
    browserPath,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--allow-file-access-from-files",
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true }
  );

  let client;
  try {
    const target = await retry(async () => {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (!response.ok) throw new Error(`CDP returned HTTP ${response.status}`);
      const targets = await response.json();
      const pageTarget = targets.find((item) => item.type === "page");
      if (!pageTarget) throw new Error("CDP page target is not ready.");
      return pageTarget;
    });
    client = new CdpClient(target.webSocketDebuggerUrl);
    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Network.enable"),
    ]);
    await client.send("Network.clearBrowserCache");
    const report = await runAudit(client, options, config);
    console.log(
      JSON.stringify(
        {
          route: report.route,
          phase: report.phase,
          states: report.states.length,
          matrixSamples: report.matrix.length,
          contactSheet: join(options.outDir, report.contactSheet),
          report: join(options.outDir, `${options.route}-${options.phase}-report.json`),
        },
        null,
        2
      )
    );
    if (report.failures.length > 0) process.exitCode = 1;
  } finally {
    try {
      await client?.send("Browser.close");
    } catch {
      browser.kill();
    }
    client?.close();
    if (browser.exitCode === null) {
      await new Promise((resolveExit) => {
        const timer = setTimeout(() => {
          browser.kill();
          resolveExit();
        }, 5_000);
        browser.once("exit", () => {
          clearTimeout(timer);
          resolveExit();
        });
      });
    }
    await rm(profile, {
      recursive: true,
      force: true,
      maxRetries: 20,
      retryDelay: 250,
    });
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
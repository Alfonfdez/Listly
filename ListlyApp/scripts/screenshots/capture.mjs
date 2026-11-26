import { chromium } from 'playwright-core';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCREENS, SET } from './manifest.mjs';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const FIXTURE_PATH = path.join(APP_ROOT, 'scripts', 'screenshots', 'fixture.json');
const DEFAULT_URL = 'http://localhost:8081';
const DEFAULT_OUT = path.join(REPO_ROOT, 'images', 'screenshots');
const STARTUP_TIMEOUT_MS = 180000;

function parseArgs(argv) {
  const opts = {
    url: DEFAULT_URL,
    out: DEFAULT_OUT,
    set: SET,
    only: null,
    server: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--url') opts.url = argv[++i];
    else if (arg === '--out') opts.out = path.resolve(argv[++i]);
    else if (arg === '--set') opts.set = argv[++i];
    else if (arg === '--only') opts.only = argv[++i];
    else if (arg === '--no-server') opts.server = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

async function urlIsUp(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

function startServer() {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'npx';
  const args = isWindows
    ? ['/d', '/s', '/c', 'npx expo start --web --port 8081 --clear']
    : ['expo', 'start', '--web', '--port', '8081', '--clear'];
  const child = spawn(command, args, {
    cwd: APP_ROOT,
    env: { ...process.env, CI: '1' },
    stdio: 'ignore',
    windowsHide: true,
  });
  return child;
}

function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

async function waitForServer(url, child) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await urlIsUp(url)) return;
    if (child && child.exitCode !== null) {
      throw new Error(`Expo exited before the server was ready (code ${child.exitCode}).`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}. Start it manually or pass --url.`);
}

async function importFixture(helpers, opts) {
  const { page } = helpers;
  await helpers.reload();
  await helpers.drawer('Settings');
  const dataRow = page.getByLabel('Data', { exact: true });
  await dataRow.waitFor({ timeout: 30000 });
  await dataRow.click();

  const importRow = page.getByText('Import data', { exact: true }).filter({ visible: true }).last();
  await importRow.waitFor({ timeout: 30000 });
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 15000 });
  await importRow.click();
  const chooser = await chooserPromise;
  await chooser.setFiles(FIXTURE_PATH);

  const confirm = page.getByRole('button', { name: 'Import', exact: true });
  await confirm.waitFor({ timeout: 15000 });
  await confirm.click();
  await page.waitForTimeout(2000);
  await helpers.reload();
  try {
    await helpers.waitHomeData();
  } catch (error) {
    await page.screenshot({ path: path.join(opts.out, 'debug-import.png'), animations: 'disabled' });
    console.error('body text after import:', (await page.locator('body').innerText()).slice(0, 800));
    throw error;
  }
}

async function shot(page, filePath, keepScroll = false) {
  await page.mouse.move(2, 2);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(150);
  if (!keepScroll) {
    for (let i = 0; i < 2; i += 1) {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        for (const el of document.querySelectorAll('*')) {
          const overflow = getComputedStyle(el).overflowY;
          if (overflow === 'auto' || overflow === 'scroll') el.scrollTop = 0;
        }
      });
      await page.waitForTimeout(250);
    }
  }
  await page.waitForTimeout(200);
  await page.screenshot({ path: filePath, animations: 'disabled' });
  console.log(`captured ${path.relative(REPO_ROOT, filePath)}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  mkdirSync(opts.out, { recursive: true });

  let server = null;
  if (opts.server && !(await urlIsUp(opts.url))) {
    console.log('starting Expo web on port 8081...');
    server = startServer();
    await waitForServer(opts.url, server);
    console.log('Expo web ready');
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'Europe/Madrid',
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('dialog', dialog => {
    console.log(`dialog: ${dialog.message()}`);
    void dialog.accept().catch(() => {});
  });
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(String(error)));

  const helpers = {
    page,
    async reload() {
      await page.goto(opts.url, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Open menu' }).waitFor({ timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
    },
    async waitHomeEmpty() {
      await page.getByText('No collections or lists yet', { exact: true }).first().waitFor({ timeout: 30000 });
      await page.waitForTimeout(300);
    },
    async waitHomeData() {
      await page.getByLabel('Someday', { exact: true }).first().waitFor({ timeout: 30000 });
      await page.waitForTimeout(300);
    },
    async openDrawer() {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.waitForTimeout(700);
    },
    async drawer(label) {
      await helpers.openDrawer();
      await page.getByRole('button', { name: new RegExp(`${label}$`) }).last().click();
      await page.waitForTimeout(600);
    },
    async settings(sub) {
      await helpers.drawer('Settings');
      if (sub) {
        await page.getByLabel(sub, { exact: true }).first().click();
        await page.waitForTimeout(600);
      }
    },
    async addList() {
      await page.getByRole('button', { name: 'Add list', exact: true }).first().click();
      await page.waitForTimeout(400);
      await page.getByText('Add list', { exact: true }).filter({ visible: true }).last().click();
      await page.getByLabel('Name', { exact: true }).waitFor({ timeout: 30000 });
    },
    async openList(name) {
      await helpers.drawer('Lists');
      await page.getByLabel(name, { exact: true }).first().click();
      await page.waitForTimeout(700);
    },
    async openLockModal(passphrase) {
      await page.getByLabel('Lock list', { exact: true }).click();
      await page.getByLabel('Passphrase', { exact: true }).waitFor({ timeout: 15000 });
      await page.getByLabel('Passphrase', { exact: true }).fill(passphrase);
      await page.getByLabel('Confirm passphrase', { exact: true }).fill(passphrase);
      await page
        .getByRole('checkbox', { name: 'I understand this passphrase cannot be recovered' })
        .click();
      await page.waitForTimeout(300);
    },
    async scrollToTop() {
      for (let i = 0; i < 2; i += 1) {
        await page.evaluate(() => {
          window.scrollTo(0, 0);
          for (const el of document.querySelectorAll('*')) {
            const overflow = getComputedStyle(el).overflowY;
            if (overflow === 'auto' || overflow === 'scroll') el.scrollTop = 0;
          }
        });
        await page.waitForTimeout(300);
      }
    },
  };

  const captureOrder = [
    ...SCREENS.filter(screen => screen.phase === 'empty'),
    ...SCREENS.filter(screen => screen.phase === 'fixture'),
  ];
  // Warm-up: the first request after a code/config change can be served from a
  // stale Metro build, so load the app twice before capturing anything.
  await helpers.reload();
  await helpers.reload();
  const needsFixture = !opts.only || SCREENS.find(screen => screen.key === opts.only)?.phase === 'fixture';
  try {
    let imported = false;
    for (const screen of captureOrder) {
      if (needsFixture && screen.phase === 'fixture' && !imported) {
        await importFixture(helpers, opts);
        imported = true;
      }
      if (opts.only && screen.key !== opts.only) continue;
      try {
        await screen.run(helpers);
        await shot(page, path.join(opts.out, `${opts.set}-${screen.key}.png`));
      } catch (error) {
        await page.screenshot({ path: path.join(opts.out, 'debug-fail.png'), animations: 'disabled' });
        console.error('body text on failure:', (await page.locator('body').innerText()).slice(0, 1200));
        throw error;
      }
    }

    if (consoleErrors.length > 0) {
      console.error('Console errors during capture:');
      for (const error of consoleErrors) console.error(`- ${error}`);
      throw new Error('Screenshot run produced console errors.');
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    stopServer(server);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

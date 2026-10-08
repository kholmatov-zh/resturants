// Controlled local API stub: validates application guards, not a real Supabase project.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const adminId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const normalId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const token = (id) =>
  Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url") +
  "." +
  Buffer.from(
    JSON.stringify({
      sub: id,
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url") +
  ".test";
const tokens = new Map([
  [token(adminId), adminId],
  [token(normalId), normalId],
]);
const user = (id) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: id === adminId ? "admin@example.test" : "user@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email" },
  user_metadata: {},
  identities: [],
});
let failDatabase = false;
let tokenRequests = 0;
const mock = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  const url = new URL(req.url, "http://localhost");
  const id = tokens.get(
    (req.headers.authorization || "").replace("Bearer ", ""),
  );
  const send = (code, data) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === "/auth/v1/token") {
    tokenRequests++;
    const input = JSON.parse(body);
    const uid = input.email === "admin@example.test" ? adminId : normalId;
    if (input.password !== "valid-password")
      return send(400, {
        code: "invalid_credentials",
        msg: "Invalid login credentials",
      });
    return send(200, {
      access_token: [...tokens].find(([, v]) => v === uid)[0],
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "test-refresh-token",
      user: user(uid),
    });
  }
  if (url.pathname === "/auth/v1/user")
    return id
      ? send(200, user(id))
      : send(401, { code: "bad_jwt", msg: "Invalid token" });
  if (url.pathname === "/auth/v1/logout") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (url.pathname.startsWith("/rest/v1/")) {
    if (!id) return send(401, { code: "42501", message: "Permission denied" });
    const table = url.pathname.split("/").pop();
    if (table === "admins")
      return send(200, id === adminId ? [{ user_id: adminId }] : []);
    if (failDatabase)
      return send(503, { code: "TEST_UNAVAILABLE", message: "Unavailable" });
    if (id !== adminId) return send(200, []);
    if (req.method === "HEAD") {
      res.writeHead(200, { "content-range": "*/0" });
      res.end();
      return;
    }
    return send(200, []);
  }
  send(404, { message: "Unknown test API" });
});
mock.listen(0, "127.0.0.1");
await once(mock, "listening");
const mockPort = mock.address().port;
const appPort = 3110;
let output = "";
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(appPort),
  ],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${mockPort}`,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        "sb_publishable_integration_test_only",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
app.stdout.on("data", (b) => {
  output += b;
});
app.stderr.on("data", (b) => {
  output += b;
});
let browser;
try {
  const base = `http://localhost:${appPort}`;
  for (let n = 0; n < 100; n++) {
    try {
      await fetch(base + "/admin/login");
      break;
    } catch {
      if (app.exitCode !== null) throw new Error("Test app did not start");
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const options = {
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox"],
  };
  browser = await chromium.launch(options);
  const context = await browser.newContext();
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (e) => browserErrors.push(e.message));
  for (const path of ["/admin", "/admin/restaurants", "/admin/leads"]) {
    await page.goto(base + path);
    assert.equal(new URL(page.url()).pathname, "/admin/login");
  }
  assert.equal(
    await page.getByRole("button", { name: "Войти в панель" }).count(),
    1,
  );
  async function login(email, password) {
    await page.getByLabel("Email администратора").fill(email);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Войти в панель" }).click();
  }
  await login("admin@example.test", "wrong");
  await page.getByRole("alert").filter({hasText: "Не удалось войти"}).waitFor();
  await login("user@example.test", "valid-password");
  await page
    .getByRole("alert")
    .filter({ hasText: "нет прав администратора" })
    .waitFor();
  await page.goto(base + "/admin/restaurants");
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  await login("admin@example.test", "valid-password");
  await page.waitForURL(base + "/admin");
  await page.getByRole("heading", { name: "Обзор платформы" }).waitFor();
  assert.equal(await page.locator(".admin-stat-grid strong").count(), 4);
  await page.getByRole("link", { name: "Рестораны", exact: true }).click();
  await page.getByRole("heading", { name: "Рестораны", exact: true }).waitFor();
  await page.getByRole("link", { name: "Заявки", exact: true }).click();
  await page.getByRole("heading", { name: "Заявки", exact: true }).waitFor();
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
  }
  failDatabase = true;
  await page.goto(base + "/admin");
  await page
    .getByRole("heading", { name: "Не удалось загрузить панель" })
    .waitFor();
  assert.equal(await page.locator(".admin-stat-grid").count(), 0);
  failDatabase = false;
  await page.goto(base + "/admin");
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await page.waitForURL(base + "/admin/login");
  await page.goto(base + "/admin");
  assert.equal(new URL(page.url()).pathname, "/admin/login");
  // A cookie claiming an admin identity is insufficient: Auth must verify the token.
  await context.addCookies([{
    name: 'sb-127-auth-token',
    value: 'base64-' + Buffer.from(JSON.stringify({
      access_token: token('cccccccc-cccc-cccc-cccc-cccccccccccc'),
      refresh_token: 'fake-refresh', expires_at: Math.floor(Date.now()/1000)+3600,
      token_type: 'bearer', user: user(adminId),
    })).toString('base64url'), domain: 'localhost', path: '/',
  }]);
  await page.goto(base + '/admin');
  assert.equal(new URL(page.url()).pathname, '/admin/login');
  assert.equal(tokenRequests, 3);
  assert.deepEqual(browserErrors, []);
  console.log(
    "PASS: unauthenticated routes blocked; bad password and non-admin denied; admin login, dashboard/lists and logout work; database failures do not display fake metrics; 4 responsive widths. Uses local API stub, not real Supabase.",
  );
} catch (error) {
  console.error(error);
  if (process.env.DEBUG_ADMIN_TEST) console.error(output);
  process.exitCode = 1;
} finally {
  await browser?.close();
  app.kill("SIGTERM");
  mock.close();
}

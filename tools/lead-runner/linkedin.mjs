// LinkedIn DOM actions, isolated so selector breakage is contained to one file.
// LinkedIn changes its DOM frequently and localises labels (this account is FR),
// so these selectors are best-effort and matched against both FR and EN text.
// Expect to adjust them periodically. Every action returns { outcome, error }.

async function gotoProfile(page, { profileUrl, name, company }) {
  if (profileUrl) {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
    return true;
  }
  if (!name) return false;
  // No stored profile URL: resolve by searching name + company.
  const q = encodeURIComponent([name, company].filter(Boolean).join(' '));
  await page.goto(`https://www.linkedin.com/search/results/people/?keywords=${q}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const first = page.locator('a[href*="/in/"]').first();
  if ((await first.count()) === 0) return false;
  await first.click();
  await page.waitForLoadState('domcontentloaded');
  return true;
}

async function humanType(locator, text) {
  await locator.click();
  await locator.fill('');
  await locator.type(text, { delay: 22 });
}

export async function sendConnectionInvite(page, { profileUrl, name, company, note }) {
  try {
    if (!(await gotoProfile(page, { profileUrl, name, company }))) {
      return { outcome: 'failed', error: 'profile not found' };
    }
    await page.waitForTimeout(1500);

    // The Connect button is sometimes primary, sometimes under a "More" menu.
    let connect = page.getByRole('button', { name: /^(connect|se connecter)$/i }).first();
    const visible = (await connect.count()) > 0 && (await connect.isVisible().catch(() => false));
    if (!visible) {
      const more = page.getByRole('button', { name: /^(more|plus)$/i }).first();
      if ((await more.count()) > 0) { await more.click(); await page.waitForTimeout(800); }
      connect = page.getByRole('button', { name: /^(connect|se connecter)$/i }).first();
    }
    if ((await connect.count()) === 0) {
      return { outcome: 'skipped', error: 'no connect affordance (already connected?)' };
    }
    await connect.click();
    await page.waitForTimeout(1200);

    if (note) {
      const addNote = page.getByRole('button', { name: /(add a note|ajouter une note)/i }).first();
      if ((await addNote.count()) > 0) { await addNote.click(); await page.waitForTimeout(600); }
      const textarea = page.locator('textarea[name="message"], textarea#custom-message, textarea').first();
      if ((await textarea.count()) > 0) await humanType(textarea, note.slice(0, 290));
    }

    const send = page.getByRole('button', { name: /^(send|envoyer|send invitation|envoyer l'invitation|send now)$/i }).last();
    if ((await send.count()) === 0) return { outcome: 'failed', error: 'no send button' };
    await send.click();
    await page.waitForTimeout(1500);

    const limit = page.getByText(/(weekly invitation limit|limite d'invitations|reached the weekly)/i);
    if ((await limit.count()) > 0) return { outcome: 'failed', error: 'weekly invite limit reached' };

    return { outcome: 'sent' };
  } catch (e) {
    return { outcome: 'failed', error: String(e?.message ?? e) };
  }
}

export async function sendMessage(page, { profileUrl, name, company, text }) {
  try {
    if (!(await gotoProfile(page, { profileUrl, name, company }))) {
      return { outcome: 'failed', error: 'profile not found' };
    }
    await page.waitForTimeout(1500);

    const msgBtn = page.getByRole('button', { name: /^message/i }).first();
    if ((await msgBtn.count()) === 0) return { outcome: 'skipped', error: 'no message button (not connected?)' };
    await msgBtn.click();
    await page.waitForTimeout(1200);

    const box = page.locator('div[role="textbox"], .msg-form__contenteditable').first();
    if ((await box.count()) === 0) return { outcome: 'failed', error: 'no message box' };
    await box.click();
    await box.type(text.slice(0, 1000), { delay: 18 });
    await page.waitForTimeout(500);

    const send = page.getByRole('button', { name: /^(send|envoyer)$/i }).last();
    if ((await send.count()) === 0) await box.press('Enter');
    else await send.click();
    await page.waitForTimeout(1200);
    return { outcome: 'sent' };
  } catch (e) {
    return { outcome: 'failed', error: String(e?.message ?? e) };
  }
}

// Acceptance detection on LinkedIn is imperfect (there is no clean "accepted" list).
// We surface recent connection profile links as best-effort accept signals.
export async function scanAcceptedInvites(page) {
  const accepted = new Set();
  try {
    await page.goto('https://www.linkedin.com/mynetwork/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const links = await page.locator('a[href*="/in/"]').evaluateAll((els) => els.slice(0, 20).map((e) => e.href));
    for (const href of links) accepted.add(href.split('?')[0]);
  } catch { /* ignore */ }
  return [...accepted];
}

export async function scanReplies(page) {
  const replies = [];
  try {
    await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const unread = page.locator('.msg-conversation-card--unread, li.msg-conversation-listitem:has(.notification-badge--show)');
    const count = Math.min(await unread.count(), 10);
    for (let i = 0; i < count; i += 1) {
      const href = await unread.nth(i).locator('a[href*="/in/"]').first().getAttribute('href').catch(() => null);
      if (href) replies.push({ personLinkedinUrl: href.split('?')[0], text: '' });
    }
  } catch { /* ignore */ }
  return replies;
}

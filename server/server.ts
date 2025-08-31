import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { migrate, query } from './db';
import { TIER_STAKES, Tier } from './types';
import { addPayout, addStake, currentAllowance, getBank } from './rtpBank';
import { getChatMember, createStarsInvoice, verifyInitData } from './bot';

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-please';

// статика WebApp и админки
app.use('/', express.static(path.resolve(__dirname, '../../webapp')));
app.use('/admin', express.static(path.resolve(__dirname, '../../admin')));

function parseInitData(initData: string): any {
  const params = new URLSearchParams(initData);
  const userStr = params.get('user');
  if (!userStr) throw new Error('initData missing user');
  return JSON.parse(userStr);
}

async function upsertUser(tg: { id: number; username?: string; first_name?: string; last_name?: string }) {
  const now = Date.now();
  const sql = `
    INSERT INTO users (telegram_id, username, first_name, last_name, created_at)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (telegram_id)
    DO UPDATE SET username=EXCLUDED.username, first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name
    RETURNING id;
  `;
  const { rows } = await query<{ id: number }>(sql, [tg.id, tg.username || null, tg.first_name || null, tg.last_name || null, now]);
  return rows[0].id;
}

// === PUBLIC API ===
app.post('/api/check-sub', async (req, res) => {
  try {
    const { initData } = req.body as { initData: string };
    if (!initData) return res.status(400).json({ error: 'initData required' });
    if (!(await verifyInitData(initData))) return res.status(401).json({ error: 'bad initData' });
    const tg = parseInitData(initData);
    await upsertUser(tg);
    const channel = process.env.REQUIRED_CHANNEL!;
    const data = await getChatMember(channel, tg.id);
    const status = data?.result?.status;
    const ok = ['member', 'administrator', 'creator'].includes(status);
    return res.json({ ok });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'check failed' });
  }
});

app.get('/api/prizes', async (req, res) => {
  const tier = Number(req.query.tier ?? 0) as Tier;
  const { rows } = await query(`SELECT id,title,image_url,value_stars,weight_base,tier_mask FROM prizes WHERE active = TRUE`);
  const filtered = rows.filter(r => (r.tier_mask & (1 << tier)) !== 0);
  res.json(filtered);
});

app.post('/api/invoice', async (req, res) => {
  try {
    const { tier } = req.body as { tier: Tier };
    const amount = TIER_STAKES[tier];
    if (!amount) return res.status(400).json({ error: 'tier must be paid' });
    const link = await createStarsInvoice(`Spin tier ${tier}`, 'Roulette spin', `spin:${tier}`, 'XTR', [{ label: 'Spin', amount }]);
    res.json({ link });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'invoice failed' });
  }
});

app.post('/api/spin', async (req, res) => {
  try {
    const { initData, tier } = req.body as { initData: string; tier: Tier };
    if (typeof tier !== 'number' || tier < 0 || tier > 3) return res.status(400).json({ error: 'bad tier' });
    if (!initData) return res.status(400).json({ error: 'initData required' });
    if (!(await verifyInitData(initData))) return res.status(401).json({ error: 'bad initData' });

    const tg = parseInitData(initData);
    const userId = await upsertUser(tg);
    const stake = TIER_STAKES[tier];

    // free spin check
    if (stake === 0) {
      const { rows } = await query<{ last_free_spin_at: string | null }>('SELECT last_free_spin_at FROM users WHERE id=$1', [userId]);
      const last = rows[0]?.last_free_spin_at ? Number(rows[0].last_free_spin_at) : null;
      if (last && Date.now() - last < 24 * 3600 * 1000) return res.status(429).json({ error: 'free spin already used' });
      const data = await getChatMember(process.env.REQUIRED_CHANNEL!, tg.id);
      const status = data?.result?.status;
      const ok = ['member', 'administrator', 'creator'].includes(status);
      if (!ok) return res.status(403).json({ error: 'subscribe required' });
    }

    const allowance = await currentAllowance(stake);
    const { rows: prizes } = await query<any>('SELECT id,title,value_stars,weight_base,tier_mask FROM prizes WHERE active=TRUE');
    const allowed = prizes.filter((p: any) => ((p.tier_mask ?? 15) & (1 << tier)) !== 0 && p.value_stars <= allowance);

    if (allowed.length === 0) {
      await addStake(stake);
      await query('INSERT INTO spins (user_id,tier,stake_stars,payout_stars,created_at) VALUES ($1,$2,$3,$4,$5)', [userId, tier, stake, 0, Date.now()]);
      if (stake === 0) await query('UPDATE users SET last_free_spin_at=$1 WHERE id=$2', [Date.now(), userId]);
      return res.json({ result: 'lose', prize: null, allowance });
    }

    const totalWeight = allowed.reduce((acc: number, p: any) => acc + Number(p.weight_base), 0);
    let r = Math.random() * totalWeight;
    let chosen = allowed[0];
    for (const p of allowed) { r -= Number(p.weight_base); if (r <= 0) { chosen = p; break; } }

    await addStake(stake);
    await addPayout(chosen.value_stars);
    await query('INSERT INTO spins (user_id,tier,stake_stars,prize_id,payout_stars,created_at) VALUES ($1,$2,$3,$4,$5,$6)', [userId, tier, stake, chosen.id, chosen.value_stars, Date.now()]);
    if (stake === 0) await query('UPDATE users SET last_free_spin_at=$1 WHERE id=$2', [Date.now(), userId]);

    await onPrizePayout(tg.id, chosen.id, chosen.value_stars);
    return res.json({ result: 'win', prize: chosen });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'spin failed' });
  }
});

async function onPrizePayout(_telegramId: number, _prizeId: number, _value: number) {
  // TODO: интегрировать выдачу подарка
}

// === ADMIN API ===
function adminGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  const pass = req.header('x-admin-password');
  if (!pass || pass !== ADMIN_PASSWORD) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.get('/api/admin/stats', adminGuard, async (_req, res) => {
  const bank = await getBank();
  const { rows: counts } = await query<{ spins: string; users: string }>(
    `SELECT (SELECT COUNT(1) FROM spins) AS spins, (SELECT COUNT(1) FROM users) AS users`
  );
  res.json({ bank, counts: { spins: Number(counts[0].spins), users: Number(counts[0].users) } });
});

app.get('/api/admin/prizes', adminGuard, async (_req, res) => {
  const { rows } = await query('SELECT * FROM prizes ORDER BY id ASC');
  res.json(rows);
});

app.post('/api/admin/prizes', adminGuard, async (req, res) => {
  const { id, title, image_url, value_stars, weight_base, tier_mask, active } = req.body;
  if (id) {
    await query(
      `UPDATE prizes SET title=$1,image_url=$2,value_stars=$3,weight_base=$4,tier_mask=$5,active=$6 WHERE id=$7`,
      [title, image_url, value_stars, weight_base, tier_mask, !!active, id]
    );
    return res.json({ ok: true, id });
  } else {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO prizes (title,image_url,value_stars,weight_base,tier_mask,active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [title, image_url, value_stars, weight_base, tier_mask, !!active]
    );
    return res.json({ ok: true, id: rows[0].id });
  }
});

const PORT = Number(process.env.PORT || 8080);
(async () => {
  await migrate();
  app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
})();

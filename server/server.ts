import 'dotenv/config';
await addStake(stake);
await query('INSERT INTO spins (user_id,tier,stake_stars,payout_stars,created_at) VALUES ($1,$2,$3,$4,$5)', [userId, tier, stake, 0, Date.now()]);
if (stake === 0) await query('UPDATE users SET last_free_spin_at=$1 WHERE id=$2', [Date.now(), userId]);
return res.json({ result: 'lose', prize: null, allowance });
}


// Взвешенный выбор
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
// TODO: Интегрируйте реальную выдачу NFT/подарка или отправку кода пользователю.
}


// ===== Admin API =====
function adminGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
const pass = req.header('x-admin-password');
if (!pass || pass !== ADMIN_PASSWORD) return res.status(401).json({ error: 'unauthorized' });
next();
}


app.get('/api/admin/stats', adminGuard, async (_req, res) => {
const bank = await (await import('./rtpBank')).getBank();
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
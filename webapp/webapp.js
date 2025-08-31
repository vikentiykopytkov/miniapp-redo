const tg = window.Telegram?.WebApp;
if (tg) tg.expand();


async function postJSON(url, body) {
const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
if (!res.ok) throw new Error((await res.json()).error || 'request failed');
return res.json();
}


async function checkSub() {
try {
const data = await postJSON('/api/check-sub', { initData: tg?.initData || '' });
document.getElementById('subStatus').textContent = data.ok ? '✅ Подписка ок' : '❌ Нет подписки';
} catch (e) {
document.getElementById('subStatus').textContent = 'Ошибка проверки';
}
}


document.getElementById('checkSub').addEventListener('click', checkSub);


async function spin(tier) {
const resultEl = document.getElementById('result');
resultEl.textContent = 'Крутим…';


if (tier !== 0) {
try {
const { link } = await postJSON('/api/invoice', { tier });
const open = tg?.openInvoice ? await tg.openInvoice(link) : null;
if (!tg?.openInvoice) window.location.href = link;
// Для продакшена: дождитесь подтверждения платежа, затем вызывайте /api/spin
} catch (e) {
resultEl.textContent = 'Не удалось выставить счет';
return;
}
}


try {
const data = await postJSON('/api/spin', { initData: tg?.initData || '', tier });
if (data.result === 'win') {
resultEl.innerHTML = `🥳 Вы выиграли <b>${data.prize.title}</b> (стоимость ${data.prize.value_stars}⭐️)`;
} else {
resultEl.textContent = 'Не повезло. Попробуйте позже!';
}
} catch (e) {
resultEl.textContent = 'Ошибка спина: ' + (e.message || e);
}
}


document.querySelectorAll('button.spin').forEach(btn => {
btn.addEventListener('click', () => spin(Number(btn.dataset.tier)));
});
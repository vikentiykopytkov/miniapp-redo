// Используем глобальный fetch из Node 18+
const BOT_TOKEN = process.env.BOT_TOKEN!;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;


export async function getChatMember(chatId: string, userId: number) {
const url = `${API}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${userId}`;
const res = await fetch(url);
if (!res.ok) throw new Error('getChatMember failed');
const data = await res.json();
if (!data.ok) throw new Error('Telegram API error');
return data;
}


export async function createStarsInvoice(title: string, description: string, payload: string, currency: 'XTR', prices: { label: string, amount: number }[]) {
const res = await fetch(`${API}/createInvoiceLink`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ title, description, payload, currency, prices })
});
if (!res.ok) throw new Error('createInvoiceLink failed');
const data = await res.json();
if (!data.ok) throw new Error('Telegram API error');
return data.result as string;
}


export async function verifyInitData(_initData: string) {
// TODO: Реализовать валидацию по HMAC-SHA256 как в доке Telegram WebApp.
return true;
}
import { query } from './db';
import { TARGET_RTP } from './types';


export async function getBank() {
const { rows } = await query<{ total_stakes: string; total_payouts: string }>(
'SELECT total_stakes, total_payouts FROM rtp_bank WHERE id=1'
);
const row = rows[0] || { total_stakes: '0', total_payouts: '0' };
return { total_stakes: Number(row.total_stakes), total_payouts: Number(row.total_payouts) };
}


export async function addStake(amount: number) {
await query('UPDATE rtp_bank SET total_stakes = total_stakes + $1 WHERE id=1', [amount]);
}


export async function addPayout(amount: number) {
await query('UPDATE rtp_bank SET total_payouts = total_payouts + $1 WHERE id=1', [amount]);
}


export async function currentAllowance(incomingStake: number) {
const { total_stakes, total_payouts } = await getBank();
const s = total_stakes + incomingStake;
const p = total_payouts;
const allowance = Math.max(0, Math.floor(TARGET_RTP * s - p));
return allowance;
}
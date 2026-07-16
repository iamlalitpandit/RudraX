#!/usr/bin/env node
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
const allowed = new Set((process.env.TELEGRAM_ALLOWED_CHAT_IDS || '').split(',').filter(Boolean));
if (!allowed.size) throw new Error('TELEGRAM_ALLOWED_CHAT_IDS must contain at least one trusted chat ID');
let offset = 0;
async function api(method, body) { const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body) }); const data=await response.json(); if(!data.ok) throw new Error(data.description); return data.result; }
console.log('RudraX Telegram gateway started');
while (true) { for (const update of await api('getUpdates',{offset,timeout:30})) { offset=update.update_id+1; const message=update.message; if(!message?.text || !allowed.has(String(message.chat.id))) continue; console.log(JSON.stringify({gateway:'telegram',chatId:message.chat.id,text:message.text})); } }

#!/usr/bin/env node
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino'; import qrcode from 'qrcode-terminal';
const authDir=process.env.WHATSAPP_AUTH_DIR || `${process.env.HOME}/.rudrax/whatsapp-auth`;
const allowed=new Set((process.env.WHATSAPP_ALLOWED_NUMBERS||'').split(',').map(x=>x.replace(/\D/g,'')).filter(Boolean));
if(!allowed.size) throw new Error('WHATSAPP_ALLOWED_NUMBERS must contain at least one trusted number');
async function start(){ const {state,saveCreds}=await useMultiFileAuthState(authDir); const socket=makeWASocket({auth:state,logger:pino({level:'warn'}),printQRInTerminal:false}); socket.ev.on('creds.update',saveCreds); socket.ev.on('connection.update',({connection,lastDisconnect,qr})=>{if(qr)qrcode.generate(qr,{small:true}); if(connection==='open')console.log('RudraX WhatsApp gateway connected'); if(connection==='close' && lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut)start();}); socket.ev.on('messages.upsert',({messages})=>{for(const message of messages){const number=(message.key.remoteJid||'').split('@')[0]; if(!message.key.fromMe && allowed.has(number)) console.log(JSON.stringify({gateway:'whatsapp',from:number,text:message.message?.conversation||message.message?.extendedTextMessage?.text||''}));}}); }
start().catch(error=>{console.error(error);process.exit(1)});

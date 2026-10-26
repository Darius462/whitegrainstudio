const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/inquiry-notification.js');
const originalFetch = global.fetch;
const previous = { secret: process.env.INQUIRY_WEBHOOK_SECRET, key: process.env.RESEND_API_KEY };
const secret = 'test-webhook-secret-at-least-32-characters';
process.env.INQUIRY_WEBHOOK_SECRET = secret;
process.env.RESEND_API_KEY = 'test-only-not-a-real-key';
after(() => {global.fetch=originalFetch;for(const [key,value] of [['INQUIRY_WEBHOOK_SECRET',previous.secret],['RESEND_API_KEY',previous.key]]){if(value===undefined)delete process.env[key];else process.env[key]=value}});
const record = {id:'27402298-626d-4c8f-b79c-13f6b6648d4b',name:'Test',email:'visitor@example.com',service:'Branding',timeline:'',message:'This is a test inquiry, not a real email.'};
const payload = {type:'INSERT',schema:'public',table:'inquiries',record};
async function call(body=payload, authorization=`Bearer ${secret}`, method='POST') {
  const res={headers:{},setHeader(k,v){this.headers[k]=v},status(s){this.code=s;return this},json(v){this.body=v;return this}};
  await handler({method,headers:{authorization},body},res);return res;
}
test('rejects unauthenticated requests without contacting email provider',async()=>{global.fetch=()=>assert.fail('Unexpected email');assert.equal((await call(payload,'wrong')).code,401);assert.equal((await call(payload,undefined,'GET')).code,405)});
test('rejects invalid events and invalid email addresses',async()=>{global.fetch=()=>assert.fail('Unexpected email');assert.equal((await call({...payload,type:'UPDATE'})).code,400);assert.equal((await call({...payload,record:{...record,email:'x\r\nBcc:other@example.com'}})).code,400);assert.equal((await call('invalid json')).code,400)});
test('sends fixed-recipient plain-text notification with reply-to and idempotency',async()=>{let sent;global.fetch=async(url,options)=>{sent={url,...options};return {ok:true}};assert.equal((await call()).code,200);const mail=JSON.parse(sent.body);assert.deepEqual(mail.to,['whitegrainstudio@gmail.com']);assert.equal(mail.reply_to,record.email);assert(mail.text.includes(record.message));assert.equal(sent.headers['Idempotency-Key'],`inquiry/${record.id}`);assert(!('html'in mail))});
test('reports provider rejection and network failure without false success',async()=>{global.fetch=async()=>({ok:false,status:403});assert.equal((await call()).code,502);global.fetch=async()=>{throw Error('offline')};assert.equal((await call()).code,502)});
test('stays inactive until secrets are configured',async()=>{delete process.env.RESEND_API_KEY;global.fetch=()=>assert.fail('Unexpected email');assert.equal((await call()).code,503);process.env.RESEND_API_KEY='test-only-not-a-real-key'});

import { getClient, allProjects } from './backend.js';
const $ = id => document.getElementById(id);
const status = text => { $('admin-status').textContent = text; };
let client, rows = [], images = [], inquiryPage = 0, sessionGeneration = 0;
const form = $('project-editor');
const field = name => form.elements.namedItem(name);
function node(tag, text, className) { const el = document.createElement(tag); if (text) el.textContent = text; if (className) el.className = className; return el; }
function action(text, run) { const b = node('button',text); b.type='button'; b.addEventListener('click',run); return b; }
function resetEditor() { form.reset(); field('id').value=''; field('year').value=new Date().getFullYear(); images=[]; $('editor-images').replaceChildren(); $('editor-status').textContent=''; }
function drawImages() {
  $('editor-images').replaceChildren();
  images.forEach((image,index) => {
    const row=node('div','', 'editor-image'); const preview=node('img');preview.src=image[0];preview.alt=image[1];
    const caption=node('input');caption.value=image[1];caption.maxLength=200;caption.setAttribute('aria-label',`Përshkrimi i fotos ${index+1}`);caption.addEventListener('input',()=>image[1]=caption.value);
    const up=action('↑',()=>{[images[index-1],images[index]]=[images[index],images[index-1]];drawImages()});up.disabled=index===0;up.setAttribute('aria-label','Zhvendos foton sipër');
    row.append(preview,caption,up,action('Hiq',()=>{images.splice(index,1);drawImages()}));$('editor-images').append(row);
  });
}
function edit(project) {
  resetEditor();
  if(project){for(const name of ['id','title','category','year','sort_order','subtitle','description'])field(name).value=project[name];field('published').checked=project.published;images=project.images.map(x=>[...x]);}
  $('editor-title').textContent=project?'Ndrysho projektin':'Projekt i ri';form.hidden=false;drawImages();field('title').focus();
}
async function loadProjects() {
  const current = sessionGeneration;
  const result=await allProjects(client,false);
  if(current!==sessionGeneration)return;
  rows=result;$('admin-projects').replaceChildren();
  if(!rows.length)$('admin-projects').append(node('p','Ende asnjë projekt. Shto projektin tënd të parë.'));
  rows.forEach(project=>{const row=node('article','','admin-project'),img=node('img');img.src=project.cover;img.alt=project.title;const details=node('div','','details');details.append(node('h3',project.title),node('p',`${project.year} · ${project.published?'I publikuar':'Draft'} · Renditja ${project.sort_order}`));const actions=node('div','','actions');actions.append(action('Ndrysho',()=>edit(project)));row.append(img,details,actions);$('admin-projects').append(row)});
}
$('new-project').addEventListener('click',()=>edit());$('cancel-edit').addEventListener('click',()=>{form.hidden=true;resetEditor()});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const files=[...$('project-files').files];
  if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10485760)){ $('editor-status').textContent='Përdor JPG, PNG ose WebP, deri 10 MB për foto.';return; }
  if(!images.length&&!files.length){$('editor-status').textContent='Shto të paktën një foto.';return;}
  const controls=[...form.querySelectorAll('button,input,select,textarea')];controls.forEach(el=>el.disabled=true);
  const uploaded=[];let saved=false;
  try{
    $('editor-status').textContent='Duke ruajtur…';const id=field('id').value||crypto.randomUUID();const nextImages=images.map(x=>[...x]);
    for(const file of files){const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];const path=`${id}/${crypto.randomUUID()}.${extension}`;const {error}=await client.storage.from('portfolio').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;uploaded.push(path);const {data}=client.storage.from('portfolio').getPublicUrl(path);nextImages.push([data.publicUrl,file.name]);}
    const category=field('category').value;const row={id,title:field('title').value.trim(),category,year:Number(field('year').value),sort_order:Number(field('sort_order').value),subtitle:field('subtitle').value.trim(),description:field('description').value.trim(),published:field('published').checked,images:nextImages,cover:nextImages[0][0],style:category==='identity'?'brand':'atelier',meta:`${field('subtitle').value.trim()} — ${field('year').value}`};
    const {error}=await client.from('projects').upsert(row);if(error)throw error;saved=true;images=nextImages;field('id').value=id;$('project-files').value='';drawImages();$('editor-status').textContent='Projekti u ruajt.';await loadProjects();
  }catch{if(!saved&&uploaded.length)await client.storage.from('portfolio').remove(uploaded);$('editor-status').textContent=saved?'Projekti u ruajt, por lista nuk u rifreskua. Rifresko faqen.':'Ruajtja dështoi. Kontrollo lidhjen dhe provo përsëri.';}
  finally{controls.forEach(el=>el.disabled=false);}
});
async function loadInquiries(reset=true){
  const current=sessionGeneration;
  if(reset)inquiryPage=0;
  const {data,error}=await client.from('inquiries').select('*').order('created_at',{ascending:false}).order('id').range(inquiryPage*50,inquiryPage*50+49);
  if(error)throw error;if(current!==sessionGeneration)return;
  if(reset)$('admin-inquiries').replaceChildren();
  if(reset&&!data.length)$('admin-inquiries').append(node('p','Ende asnjë kërkesë.'));
  data.forEach(item=>{const row=node('article','','inquiry');const email=node('a',item.email);email.href=`mailto:${encodeURIComponent(item.email)}`;const state=node('select');state.setAttribute('aria-label',`Statusi i kërkesës nga ${item.name}`);for(const [value,label]of [['new','E re'],['read','E lexuar'],['done','E përfunduar']]){const option=node('option',label);option.value=value;state.append(option)}state.value=item.status;
    state.addEventListener('change',async()=>{state.disabled=true;const {error}=await client.from('inquiries').update({status:state.value}).eq('id',item.id);if(error){state.value=item.status;status('Statusi nuk u ruajt.')}else item.status=state.value;state.disabled=false});
    row.append(node('h3',item.name),email,node('p',`${item.service} · ${item.timeline||'Afati për t’u diskutuar'} · ${new Date(item.created_at).toLocaleString('sq-AL')}`),node('p',item.message,'inquiry-message'),state);$('admin-inquiries').append(row)});
  $('more-inquiries').hidden=data.length<50;
}
for(const name of ['projects','inquiries'])$(name+'-tab').addEventListener('click',async()=>{for(const tab of ['projects','inquiries']){$(tab+'-panel').hidden=tab!==name;$(tab+'-tab').setAttribute('aria-pressed',String(tab===name))}if(name==='inquiries')try{await loadInquiries()}catch{status('Kërkesat nuk u ngarkuan. Provo përsëri.')}});
$('refresh-inquiries').addEventListener('click',()=>loadInquiries().catch(()=>status('Kërkesat nuk u ngarkuan.')));
$('more-inquiries').addEventListener('click',async()=>{inquiryPage++;$('more-inquiries').disabled=true;try{await loadInquiries(false)}catch{inquiryPage--;status('Kërkesat nuk u ngarkuan.')}finally{$('more-inquiries').disabled=false}});
async function refreshSession(){
  sessionGeneration++;const current=sessionGeneration;const {data,error}=await client.auth.getSession();if(error)throw error;
  $('dashboard').hidden=true;$('logout').hidden=true;$('login').hidden=false;
  if(!data.session){status('Hyr me llogarinë e administratorit.');return}
  const {data:allowed,error:accessError}=await client.rpc('is_admin');if(current!==sessionGeneration)return;if(accessError)throw new Error('admin_check');
  if(!allowed){await client.auth.signOut();throw new Error('access')}
  $('login').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;status('');try{await loadProjects()}catch{status('Hyrja u krye, por projektet nuk u ngarkuan. Kontrollo lidhjen dhe lejet e tabelës projects.')}
}
function loginError(error) {
  if (error.message === 'access') return 'Llogaria nuk ka leje administratori. Shto User UID te tabela admins në Supabase.';
  if (error.code === 'invalid_credentials') return 'Emaili ose fjalëkalimi nuk është i saktë. Përdor llogarinë e krijuar te Authentication → Users të Whitegrain.';
  if (error.code === 'email_not_confirmed') return 'Emaili nuk është konfirmuar. Konfirmo përdoruesin te Authentication → Users në Supabase.';
  if (error.status === 429) return 'Shumë tentativa hyrjeje. Prit pak dhe provo përsëri.';
  if (error.message === 'admin_check') return 'Hyrja u krye, por leja e administratorit nuk u verifikua. Kontrollo funksionin is_admin dhe lidhjen.';
  return 'Hyrja nuk u përfundua. Kontrollo lidhjen dhe provo përsëri.';
}
$('login').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('login').querySelector('button');button.disabled=true;
  try {
    const {error}=await client.auth.signInWithPassword({email:$('login').elements.email.value.trim(),password:$('login').elements.password.value});
    if(error)throw error;
    await refreshSession();
    $('login').reset();
  }catch(error){status(loginError(error))}finally{button.disabled=false}
});
$('logout').addEventListener('click',async()=>{const {error}=await client.auth.signOut();if(error){status('Dalja dështoi. Provo përsëri.');return}sessionGeneration++;$('admin-inquiries').replaceChildren();$('admin-projects').replaceChildren();rows=[];resetEditor();form.hidden=true;await refreshSession()});
try{client=await getClient();if(!client){$('login').hidden=true;status('Lidh fillimisht projektin Supabase sipas udhëzimit SETUP.md.')}else{await refreshSession();client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){sessionGeneration++;$('dashboard').hidden=true;$('logout').hidden=true;$('login').hidden=false;$('admin-inquiries').replaceChildren();$('admin-projects').replaceChildren();resetEditor();form.hidden=true;status('Sesioni përfundoi. Hyr përsëri.')}})}}catch{status('Paneli nuk u lidh. Kontrollo konfigurimin dhe aksesin e administratorit.')}

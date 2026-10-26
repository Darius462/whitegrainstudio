const projects = {
  whitegrain: {
    category: 'identity', year: 2025, subtitle: 'Identitet vizual & print', cover: 'assets/business-card-contact.jpg', style: 'brand',
    title: 'White Grain', meta: 'Identitet vizual / Print — 2025',
    description: 'Identiteti i studios sonë, i sjellë në letër. Një sistem i përmbajtur grafik ku tipografia, kontrasti dhe materiali ndërtojnë një gjuhë të përbashkët.',
    images: [['assets/business-card-stack.jpg', 'White Grain — kartëvizita dhe materialitet'], ['assets/business-card-contact.jpg', 'Sistemi grafik dhe detajet e kontaktit']]
  },
  blue: {
    category: 'space', year: 2025, subtitle: 'Koncept hapësinor & modelim 3D', cover: 'assets/kiosk-blue-render.jpg', style: 'kiosk',
    title: 'Kioska Blue', meta: 'Koncept hapësinor / Modelim 3D — 2025',
    description: 'Koncept për një kioskë shërbimi me panelim të personalizuar. Ngjyra blu dhe grafika organike lidhin identitetin vizual me strukturën, ndërsa plani eksploron organizimin e hapësirës.',
    images: [['assets/kiosk-blue-render.jpg', 'Pamja axonometrike e kioskës'], ['assets/kiosk-blue-plan.jpg', 'Planimetria dhe pamjet e projektit']]
  },
  atelier: {
    category: 'space', year: 2024, subtitle: 'Studim interieri & ilustrim arkitekturor', cover: 'assets/atelier-room-axonom.jpg', style: 'atelier',
    title: 'Van Gogh Atelier', meta: 'Studim interieri / Ilustrim arkitekturor — 2024',
    description: 'Një interpretim hapësinor i frymëzuar nga atelier-i i Van Gogh. Muret me ngjyra, pikturat dhe shkallët prej druri krijojnë një dialog mes artit dhe hapësirës së punës.',
    images: [['assets/atelier-room-axonom.jpg', 'Axonometria — organizimi i atelier-it'], ['assets/atelier-section.jpg', 'Seksioni — ngjyra, lartësi dhe materiale'], ['assets/atelier-elevation.jpg', 'Elevacioni — vizatimi teknik i objekteve dhe mobilimit']]
  },
  white: {
    category: 'space', year: 2025, subtitle: 'Formë, volum & materialitet', cover: 'assets/kiosk-white-render.jpg', style: 'white',
    title: 'Kioska White', meta: 'Koncept hapësinor / Studim vëllimor — 2025',
    description: 'Një studim monokrom i konceptit të kioskës. Paleta e bardhë vendos në fokus volumet, hapjet dhe marrëdhënien mes elementeve të strukturës.',
    images: [['assets/kiosk-white-render.jpg', 'Studimi monokrom i volumeve']]
  }
};

document.getElementById('year').textContent = new Date().getFullYear();
const grid = document.querySelector('.project-grid');
const filters = document.querySelectorAll('[data-filter]');
const PAGE_SIZE = 6;
let activeFilter = 'all';
let visibleCount = PAGE_SIZE;
const search = document.getElementById('project-search');
const more = document.getElementById('load-more');
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const entries = Object.entries(projects);
const countLabel = (count) => String(count).padStart(2, '0');
function updateCounts() {
  document.querySelector('.nav-count').textContent = `(${countLabel(entries.length)})`;
  const years = entries.map(([, project]) => project.year);
  document.getElementById('portfolio-years').textContent = years.length ? `${Math.min(...years)} — ${Math.max(...years)}` : '';
  filters.forEach((button) => {
    const count = entries.filter(([, project]) => button.dataset.filter === 'all' || project.category === button.dataset.filter).length;
    const badge = document.createElement('sup');
    badge.textContent = countLabel(count);
    button.querySelector('sup')?.remove();
    button.append(badge);
  });
}
updateCounts();
filters.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    visibleCount = PAGE_SIZE;
    renderProjects();
  });
});
function renderProjects() {
  const query = normalize(search.value.trim());
  const matches = entries.filter(([, project]) =>
    (activeFilter === 'all' || project.category === activeFilter) &&
    normalize(`${project.title} ${project.subtitle} ${project.year}`).includes(query)
  );
  grid.replaceChildren();
  matches.slice(0, visibleCount).forEach(([key, project]) => {
    const article = document.createElement('article');
    article.className = 'project';
    article.id = `project-${key}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `project-image project-image--${project.style || 'atelier'}`;
    button.setAttribute('aria-label', `Hap projektin ${project.title}`);
    const image = document.createElement('img');
    image.src = project.cover || project.images[0][0];
    image.alt = project.title;
    image.loading = 'lazy';
    const arrow = document.createElement('span');
    arrow.className = 'project-open';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    button.append(image, arrow);
    button.addEventListener('click', () => openProject(key, button));
    const caption = document.createElement('div');
    caption.className = 'project-caption';
    const info = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = project.title;
    const subtitle = document.createElement('p');
    subtitle.textContent = project.subtitle;
    info.append(title, subtitle);
    const year = document.createElement('span');
    year.textContent = project.year;
    caption.append(info, year);
    article.append(button, caption);
    grid.append(article);
  });
  filters.forEach((button) => {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const shown = Math.min(visibleCount, matches.length);
  document.getElementById('project-count').textContent = `${shown} nga ${matches.length} projekte`;
  document.getElementById('filter-status').textContent = matches.length ? `${shown} nga ${matches.length} projekte të shfaqura.` : 'Nuk u gjet asnjë projekt. Provo një kërkim tjetër.';
  document.getElementById('no-projects').hidden = matches.length > 0;
  more.hidden = shown >= matches.length;
}
search.addEventListener('input', () => { visibleCount = PAGE_SIZE; renderProjects(); });
more.addEventListener('click', () => {
  const previousCount = grid.children.length;
  visibleCount += PAGE_SIZE;
  renderProjects();
  grid.children[previousCount]?.querySelector('button').focus({ preventScroll: true });
});
renderProjects();

const dialog = document.getElementById('project-dialog');
const gallery = document.getElementById('dialog-gallery');
let opener;
function openProject(key, trigger) {
  const project = projects[key];
  if (!project) return;
  opener = trigger;
  document.getElementById('dialog-title').textContent = project.title;
  document.getElementById('dialog-meta').textContent = project.meta;
  document.getElementById('dialog-description').textContent = project.description;
  gallery.replaceChildren();
  project.images.forEach(([src, caption], index) => {
    const figure = document.createElement('figure');
    figure.className = 'gallery-image';
    const image = document.createElement('img');
    image.src = src;
    image.alt = caption;
    image.loading = index === 0 ? 'eager' : 'lazy';
    const text = document.createElement('figcaption');
    text.textContent = `${String(index + 1).padStart(2, '0')} / ${caption}`;
    figure.append(image, text);
    gallery.append(figure);
  });
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
}
document.querySelectorAll('[data-project]').forEach((button) => {
  button.addEventListener('click', () => openProject(button.dataset.project, button));
});
document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (opener) opener.focus({ preventScroll: true });
});

const requestForm = document.getElementById('request-form');
requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requestForm.reportValidity()) return;
  const fields = new FormData(requestForm);
  const submit = requestForm.querySelector('[type="submit"]');
  const status = document.getElementById('request-status');
  submit.disabled = true;
  status.textContent = 'Duke dërguar kërkesën…';
  try {
    const client = await backendClient;
    if (!client) throw new Error('offline');
    const { error } = await client.rpc('submit_inquiry', {
      p_name: fields.get('name').trim(), p_email: fields.get('email').trim(),
      p_service: fields.get('service'), p_timeline: fields.get('timeline') || '',
      p_message: fields.get('message').trim(), p_website: fields.get('website') || ''
    });
    if (error) throw error;
    requestForm.reset();
    status.textContent = 'Faleminderit! Kërkesa u dërgua. Do të të kontaktojmë në emailin që plotësove.';
  } catch {
    status.textContent = 'Kërkesa nuk u dërgua. Të dhënat e tua janë ende këtu; provo përsëri ose na shkruaj në email.';
    const fallback = document.getElementById('email-fallback');
    fallback.href = `mailto:whitegrainstudio@gmail.com?subject=${encodeURIComponent('Kërkesë bashkëpunimi')}&body=${encodeURIComponent(`${fields.get('name')}\n${fields.get('email')}\n${fields.get('service')}\n${fields.get('timeline')}\n\n${fields.get('message')}`)}`;
    fallback.textContent = 'Dërgo kërkesën me email ↗';
    fallback.hidden = false;
  } finally { submit.disabled = false; }
});

const backendClient = import('./backend.js').then(({ getClient }) => getClient()).catch(() => null);
(async () => {
  const client = await backendClient;
  if (!client) return;
  document.getElementById('request-note').textContent = 'Kërkesa dhe të dhënat e kontaktit ruhen për t’iu përgjigjur projektit tënd. Mos përfshi të dhëna të ndjeshme.';
  requestForm.querySelector('[type="submit"]').firstChild.textContent = 'Dërgo kërkesën ';
  try {
    const { allProjects } = await import('./backend.js');
    const rows = await allProjects(client);
    Object.keys(projects).forEach(key => delete projects[key]);
    entries.splice(0);
    rows.forEach(row => { projects[row.id] = row; entries.push([row.id, row]); });
    updateCounts();
    renderProjects();
  } catch {
    document.getElementById('filter-status').textContent = 'Projektet online nuk u ngarkuan. Po shfaqet koleksioni lokal.';
  }
})();

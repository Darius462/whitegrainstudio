const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const nav = document.querySelector('.nav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const current = window.scrollY;
  if (!nav) return;
  if (current > lastScroll && current > 80) {
    nav.style.opacity = '0';
  } else {
    nav.style.opacity = '1';
  }
  lastScroll = current;
});

const works = [
  {
    title: 'Atelier — Seksion',
    description: 'Fragmenti vertikal i studios së frymëzuar nga Van Gogh.',
    image: 'assets/atelier-section.jpg',
    location: 'Koncept 3D',
    year: '2024',
    tags: ['installim', 'teksturë']
  },
  {
    title: 'Atelier — Axonometria',
    description: 'Pamje hapësinore me shkallët prej druri dhe set pikturash.',
    image: 'assets/atelier-room-axonom.jpg',
    location: 'Hibrid analog/digital',
    year: '2024',
    tags: ['set design', 'art direction']
  },
  {
    title: 'Atelier — Elevacioni',
    description: 'Skicë lineare që dokumenton objektet dhe mobilimin.',
    image: 'assets/atelier-elevation.jpg',
    location: 'Drafting board',
    year: '2024',
    tags: ['vizatim teknik']
  },
  {
    title: 'Kioskë Blue',
    description: 'Identitet modular me grafikë organike dhe panele të hapura.',
    image: 'assets/kiosk-blue-render.jpg',
    location: 'Koncept shërbimi',
    year: '2025',
    tags: ['visual identity', '3D render']
  },
  {
    title: 'Kioskë Blue — Plane',
    description: 'Planimetri dhe pamje nga lart të panelit të personalizuar.',
    image: 'assets/kiosk-blue-plan.jpg',
    location: 'Manual prezantimi',
    year: '2025',
    tags: ['layout', 'packaging']
  },
  {
    title: 'Kioskë White',
    description: 'Version monokrom për të theksuar volumet dhe pajisjet.',
    image: 'assets/kiosk-white-render.jpg',
    location: 'Render koncept',
    year: '2025',
    tags: ['space design']
  },
  {
    title: 'Kartëvizita — Stack',
    description: 'Material i trashë me shtresa të bardha dhe logo të stampuar.',
    image: 'assets/business-card-stack.jpg',
    location: 'Print',
    year: '2025',
    tags: ['identity', 'print']
  },
  {
    title: 'Kartëvizita — Detaje',
    description: 'Kornizim i informacionit me tipografi të thjeshtë.',
    image: 'assets/business-card-contact.jpg',
    location: 'Kontakt direkt',
    year: '2025',
    tags: ['brand system']
  }
];

const portfolioGrid = document.getElementById('portfolio-grid');
const createWorkCard = (work) => {
  const figure = document.createElement('figure');
  figure.className = 'portfolio__item';

  const img = document.createElement('img');
  img.src = work.image;
  img.alt = work.title;
  figure.appendChild(img);

  const caption = document.createElement('figcaption');
  const tags = Array.isArray(work.tags) ? work.tags.map((tag) => `<em>${tag}</em>`).join(' · ') : '';
  caption.innerHTML = `
    <strong>${work.title}</strong>
    <span>${work.description || ''}</span>
    <small>${[work.location, work.year].filter(Boolean).join(' • ')}</small>
    ${tags ? `<p class="portfolio__tags">${tags}</p>` : ''}
  `;

  if (work.link) {
    const anchor = document.createElement('a');
    anchor.href = work.link;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.textContent = 'Shiko më shumë';
    anchor.className = 'portfolio__link';
    caption.appendChild(anchor);
  }

  figure.appendChild(caption);
  return figure;
};

if (portfolioGrid) {
  if (!works.length) {
    portfolioGrid.innerHTML = '<p class="portfolio__empty">Shto projektin tënd të parë në listën <code>works</code> brenda script.js.</p>';
  } else {
    works.forEach((work) => {
      portfolioGrid.appendChild(createWorkCard(work));
    });
  }
}

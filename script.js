'use strict';
(() => {
  const d = window.CLUB;
  if (!d) return;
  const $ = selector => document.querySelector(selector);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const external = (url, text, cls = '') => {
    const a = el('a', cls, text);
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  };
  document.title = d.name;
  document.querySelectorAll('[data-classroom]').forEach(a => a.href = d.classroomUrl);
  document.querySelectorAll('[data-season]').forEach(n => n.textContent = `${d.season} SEASON`);
  $('#copyright-year').textContent = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: d.timeZone }).format(new Date());
  const dateValue = date => new Date(`${date}T12:00:00Z`);
  const format = (date, options) => new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(dateValue(date));
  const ordinal = date => Date.parse(`${date}T00:00:00Z`) / 86400000;
  const today = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: d.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = type => parts.find(p => p.type === type).value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  };
  const events = [...d.events].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  const remaining = event => {
    const current = ordinal(today());
    if (current > ordinal(event.endDate || event.date)) return 'Event ended';
    if (current >= ordinal(event.date)) return event.endDate && event.date !== event.endDate ? 'Event in progress' : 'Today';
    const days = ordinal(event.date) - current;
    return `${days} day${days === 1 ? '' : 's'} to go`;
  };
  const dateLabel = event => event.endDate ? `${format(event.date, { month: 'short', day: 'numeric', year: 'numeric' })} – ${format(event.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}` : format(event.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const statuses = { invoice: 'Invoice on file · payment unverified', planned: 'Planned · registration unverified', confirmed: 'Paid / confirmed' };
  const status = event => el('span', `status ${event.registration}`, statuses[event.registration] || statuses.planned);
  const attachCount = (node, event) => {
    node.dataset.countdown = event.date;
    node.textContent = remaining(event);
  };
  const updates = $('#announcements');
  if (updates) d.announcements.forEach(item => {
    const card = el('article', 'card update-card');
    card.append(el('span', 'mini-label', item.label), el('h3', '', item.title), el('p', '', item.detail));
    updates.append(card);
  });
  const teams = $('#teams-grid');
  if (teams) d.teams.forEach((item, i) => {
    const card = el('article', 'card team-card'), top = el('div', 'team-card-top'), meta = el('div', 'team-meta');
    top.append(el('span', 'card-index', String(i + 1).padStart(2, '0')), el('span', `status ${item.status === 'Forming' ? 'forming' : ''}`, item.status));
    meta.append(el('strong', '', item.members), el('span', '', item.leaders));
    card.append(top, el('h3', '', item.name), el('p', '', item.description), el('p', 'team-goal', `Next focus: ${item.goal}`), meta);
    teams.append(card);
  });
  const resources = $('#resources-grid');
  if (resources) d.resources.forEach(item => {
    const a = external(item.url, '', 'resource-card');
    a.append(el('span', 'mini-label', item.group), el('span', 'arrow', '↗'), el('h3', '', item.title), el('p', '', item.description));
    resources.append(a);
  });
  function renderNext(target) {
    if (!target) return;
    target.replaceChildren();
    const event = events.find(e => ordinal(e.endDate || e.date) >= ordinal(today()));
    if (!event) { target.append(el('h3', '', 'The next chapter is coming.'), el('p', '', 'No upcoming events are currently listed. Check Classroom for updates.')); return; }
    const copy = el('div'), counter = el('div', 'countdown');
    copy.append(el('span', 'mini-label', 'NEXT ON THE CALENDAR'), el('h3', '', event.name), el('p', '', `${dateLabel(event)} · ${event.location}`), status(event));
    const days = ordinal(event.date) - ordinal(today());
    counter.append(el('strong', '', days > 0 ? String(days).padStart(2, '0') : 'Now'), el('span', '', days > 0 ? 'DAYS TO GO' : remaining(event)));
    target.append(copy, counter);
  }
  renderNext($('#next-event')); renderNext($('#calendar-next'));
  const search = $('#faq-search');
  if (search) {
    const filters = $('#faq-filters'), list = $('#faq-list'), count = $('#faq-results');
    let active = 'All questions';
    function renderFaq() {
      const term = search.value.trim().toLowerCase();
      const matches = d.faq.filter(x => (active === 'All questions' || x.category === active) && `${x.q} ${x.a} ${x.category}`.toLowerCase().includes(term));
      list.replaceChildren(); count.textContent = `${matches.length} question${matches.length === 1 ? '' : 's'}`;
      if (!matches.length) { list.append(el('div', 'empty-state', 'No matching questions. Try another search or choose All questions.')); return; }
      matches.forEach(item => {
        const detail = el('details'), summary = el('summary', '', item.q), answer = el('div', 'faq-answer');
        answer.append(el('span', 'answer-category', item.category), document.createTextNode(item.a));
        detail.append(summary, answer); list.append(detail);
      });
    }
    ['All questions', ...new Set(d.faq.map(x => x.category))].forEach(category => {
      const button = el('button', 'filter', category);
      button.type = 'button'; button.setAttribute('aria-pressed', String(category === active));
      button.addEventListener('click', () => { active = category; filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); renderFaq(); });
      filters.append(button);
    });
    search.addEventListener('input', renderFaq); renderFaq();
  }
  if ($('#calendar-grid')) {
    const current = today().split('-').map(Number), yearSelect = $('#calendar-year');
    let year = current[0] < 2026 ? 2026 : current[0] > 2027 ? 2027 : current[0];
    let month = current[0] < 2026 ? 0 : current[0] > 2027 ? 11 : current[1] - 1;
    let selected = null;
    const iso = day => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const covers = (event, date) => event.date <= date && (event.endDate || event.date) >= date;
    function renderMonthEvents() {
      const list = $('#month-events'); list.replaceChildren();
      const start = iso(1), end = iso(new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
      const visible = events.filter(e => selected ? covers(e, selected) : e.date <= end && (e.endDate || e.date) >= start);
      $('#month-events-title').textContent = selected ? format(selected, { month: 'long', day: 'numeric' }) : format(start, { month: 'long' });
      if (!visible.length) { list.append(el('p', 'fact-note', 'No events listed. Check Classroom for practice plans and updates.')); return; }
      visible.forEach(event => {
        const card = el('article', 'month-event'), count = el('p', 'countdown-text');
        attachCount(count, event);
        card.append(el('small', '', dateLabel(event)), el('strong', '', event.name), el('small', '', event.location), count, status(event), el('p', 'fact-note', event.verification), external(event.source, 'Official event information ↗'));
        list.append(card);
      });
    }
    function renderTimeline() {
      const list = $('#events-list'); list.replaceChildren();
      events.filter(e => e.date.startsWith(String(year)) || (e.endDate || '').startsWith(String(year))).forEach(event => {
        const row = el('article', 'event'), date = el('div', 'event-date'), main = el('div'), count = el('div', 'event-count'), text = el('span', 'countdown-text');
        date.append(el('small', '', format(event.date, { month: 'short' }).toUpperCase()), document.createTextNode(format(event.date, { day: 'numeric' })), el('span', '', event.endDate ? `→ ${format(event.endDate, { month: 'short', day: 'numeric' })}` : format(event.date, { year: 'numeric' })));
        main.append(el('h3', '', event.name), el('p', '', `${dateLabel(event)} · ${event.location}`), el('p', '', event.teams), status(event), el('p', 'verification', event.verification), external(event.source, 'Official event information ↗'));
        attachCount(text, event); count.append(text, el('small', '', 'Eastern calendar days'));
        row.append(date, main, count); list.append(row);
      });
    }
    function renderCalendar() {
      const grid = $('#calendar-grid'); grid.replaceChildren();
      const title = format(iso(1), { month: 'long', year: 'numeric' });
      $('#month-title').textContent = title; grid.setAttribute('aria-label', title); yearSelect.value = String(year);
      const offset = new Date(Date.UTC(year, month, 1)).getUTCDay(), days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      for (let i = 0; i < offset; i++) { const blank = el('div', 'calendar-day empty'); blank.setAttribute('aria-hidden', 'true'); grid.append(blank); }
      for (let day = 1; day <= days; day++) {
        const date = iso(day), onDay = events.filter(e => covers(e, date));
        const cell = el(onDay.length ? 'button' : 'div', `calendar-day${onDay.length ? ' has-event' : ''}${date === today() ? ' today' : ''}${date === selected ? ' selected' : ''}`, String(day));
        cell.setAttribute('aria-label', `${format(date, { month: 'long', day: 'numeric', year: 'numeric' })}${onDay.length ? ': ' + onDay.map(e => e.name).join(', ') : ''}`);
        if (date === today()) cell.setAttribute('aria-current', 'date');
        if (onDay.length) {
          cell.type = 'button'; cell.setAttribute('aria-pressed', String(date === selected)); cell.append(el('i'));
          cell.addEventListener('click', () => {
            selected = selected === date ? null : date;
            grid.querySelectorAll('button').forEach(b => { const active = b === cell && selected !== null; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
            renderMonthEvents();
          });
        }
        grid.append(cell);
      }
      $('#prev-month').disabled = year === 2026 && month === 0;
      $('#next-month').disabled = year === 2027 && month === 11;
      renderMonthEvents(); renderTimeline();
    }
    function move(delta) { const date = new Date(Date.UTC(year, month + delta, 1)); year = date.getUTCFullYear(); month = date.getUTCMonth(); selected = null; renderCalendar(); }
    $('#prev-month').addEventListener('click', () => move(-1)); $('#next-month').addEventListener('click', () => move(1));
    $('#calendar-today').addEventListener('click', () => { const now = today().split('-').map(Number); year = Math.min(2027, Math.max(2026, now[0])); month = now[0] < 2026 ? 0 : now[0] > 2027 ? 11 : now[1] - 1; selected = null; renderCalendar(); });
    yearSelect.addEventListener('change', () => { year = Number(yearSelect.value); selected = null; renderCalendar(); });
    renderCalendar();
  }
  const toggle = $('.menu-toggle'), nav = $('#main-nav');
  const closeMenu = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); };
  toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); } });
  window.matchMedia('(min-width:851px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  setInterval(() => {
    document.querySelectorAll('[data-countdown]').forEach(node => { const event = events.find(e => e.date === node.dataset.countdown); if (event) node.textContent = remaining(event); });
    renderNext($('#next-event')); renderNext($('#calendar-next'));
  }, 60000);
})();

(() => {
  'use strict';

  const CONTENT = Object.freeze([
    { eyebrow: 'WELCOME TO ENTIG', title: 'Every word brings\nyou closer.', description: 'Find Tigrinya translations for English words, in one simple place.', next: 'Continue' },
    { eyebrow: 'ENGLISH TO TIGRINYA', title: 'From one language\nto another.', description: 'Type an English word. See its Tigrinya translation in a clear, readable view.', next: 'Continue' },
    { eyebrow: 'YOUR NEXT WORD', title: 'Start with\na word.', description: 'A familiar greeting. Something for today. Your next word is waiting.', next: 'Start exploring' }
  ]);
  const STORAGE_KEY = 'entig:onboarding:v1';
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    onboarding: $('#onboarding'), dictionary: $('#dictionary'), title: $('#step-title'), eyebrow: $('#step-eyebrow'), description: $('#step-description'), nextLabel: $('#next-label'), next: $('#next'), back: $('#back'), skip: $('#skip'), restart: $('#restart'), currentStep: $('#current-step'), copy: $('#step-copy'), announcer: $('#announcer'), search: $('#word-search'), results: $('#search-results'), resultTitle: $('#result-title'), resultCount: $('#result-count')
  };
  const dots = [...document.querySelectorAll('[data-step]')];
  const scenes = [...document.querySelectorAll('[data-scene]')];
  let currentStep = 0;
  let announcementTimer;

  function announce(message) {
    clearTimeout(announcementTimer);
    elements.announcer.textContent = '';
    announcementTimer = setTimeout(() => { elements.announcer.textContent = message; }, 70);
  }

  function readCompletion() {
    try { return localStorage.getItem(STORAGE_KEY) === 'complete'; }
    catch { return false; }
  }

  function persistCompletion(completed) {
    try {
      if (completed) localStorage.setItem(STORAGE_KEY, 'complete');
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* Private browser storage can be unavailable; the current session still works. */ }
  }

  function animate(element) {
    element.classList.remove('entering');
    void element.offsetWidth;
    element.classList.add('entering');
  }

  function renderStep(step, { focus = false, speak = true } = {}) {
    currentStep = Math.max(0, Math.min(CONTENT.length - 1, step));
    const content = CONTENT[currentStep];
    elements.onboarding.hidden = false;
    elements.dictionary.hidden = true;
    elements.skip.hidden = false;
    elements.restart.hidden = true;
    elements.eyebrow.textContent = content.eyebrow;
    elements.title.replaceChildren();
    content.title.split('\n').forEach((line, index) => {
      if (index) elements.title.append(document.createElement('br'));
      elements.title.append(document.createTextNode(line));
    });
    elements.description.textContent = content.description;
    elements.nextLabel.textContent = content.next;
    elements.currentStep.textContent = String(currentStep + 1).padStart(2, '0');
    elements.back.hidden = currentStep === 0;
    dots.forEach((dot, index) => {
      if (index === currentStep) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    scenes.forEach((scene, index) => {
      scene.hidden = index !== currentStep;
      if (index === currentStep) animate(scene);
    });
    animate(elements.copy);
    document.title = 'EnTig — A word closer';
    if (focus) elements.title.focus({ preventScroll: true });
    if (speak) announce(`Step ${currentStep + 1} of ${CONTENT.length}. ${content.title.replace('\n', ' ')} ${content.description}`);
  }

  function appendResult(entry) {
    const article = document.createElement('article');
    article.className = 'result-card';
    const source = document.createElement('div');
    const word = document.createElement('span');
    word.className = 'result-source';
    word.textContent = entry.english;
    const language = document.createElement('span');
    language.className = 'result-language';
    language.textContent = 'English';
    source.append(word, language);
    const target = document.createElement('div');
    target.className = 'result-translation';
    const translated = document.createElement('span');
    translated.lang = 'ti';
    translated.dir = 'ltr';
    translated.textContent = entry.tigrinya;
    const targetLabel = document.createElement('span');
    targetLabel.className = 'result-language';
    targetLabel.textContent = 'Tigrinya';
    target.append(translated, targetLabel);
    article.append(source, target);
    elements.results.append(article);
  }

  function search({ speak = true } = {}) {
    const query = elements.search.value.trim().toLocaleLowerCase('en');
    const dataset = window.ENTIG_DEMO_DICTIONARY || [];
    const matches = query ? dataset.filter((entry) => entry.english.toLocaleLowerCase('en').includes(query)) : dataset;
    elements.results.replaceChildren();
    elements.resultTitle.textContent = query ? 'Tigrinya translation' : 'A place to begin';
    elements.resultCount.textContent = `${matches.length} ${matches.length === 1 ? 'word' : 'words'}`;
    matches.forEach(appendResult);
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-result';
      const title = document.createElement('h3');
      title.textContent = 'No word found';
      const help = document.createElement('p');
      help.textContent = 'Check the spelling or try another English word.';
      empty.append(title, help);
      elements.results.append(empty);
    }
    if (speak) announce(matches.length ? `${matches.length} ${matches.length === 1 ? 'translation' : 'translations'} found${query ? ` for ${elements.search.value.trim()}` : ''}.` : 'No word found. Check the spelling or try another English word.');
  }

  function showDictionary({ persist = true, focus = true } = {}) {
    if (persist) persistCompletion(true);
    elements.onboarding.hidden = true;
    elements.dictionary.hidden = false;
    elements.skip.hidden = true;
    elements.restart.hidden = false;
    elements.search.value = '';
    document.title = 'EnTig — English to Tigrinya';
    search({ speak: false });
    if (focus) elements.search.focus({ preventScroll: true });
    announce('Welcome to EnTig. Search for an English word.');
  }

  elements.next.addEventListener('click', () => {
    if (currentStep === CONTENT.length - 1) showDictionary();
    else renderStep(currentStep + 1, { focus: true });
  });
  elements.back.addEventListener('click', () => renderStep(currentStep - 1, { focus: true }));
  elements.skip.addEventListener('click', () => showDictionary());
  elements.restart.addEventListener('click', () => {
    persistCompletion(false);
    history.replaceState(null, '', location.pathname);
    renderStep(0, { focus: true });
  });
  dots.forEach((dot) => dot.addEventListener('click', () => renderStep(Number(dot.dataset.step))));
  document.addEventListener('keydown', (event) => {
    if (elements.onboarding.hidden || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'Home' ? 0 : event.key === 'End' ? CONTENT.length - 1 : currentStep + (event.key === 'ArrowRight' ? 1 : -1);
    renderStep(step);
    dots[currentStep].focus({ preventScroll: true });
  });
  $('#search-form').addEventListener('submit', (event) => { event.preventDefault(); search(); });
  elements.search.addEventListener('input', () => search());
  document.querySelectorAll('[data-query]').forEach((button) => button.addEventListener('click', () => {
    elements.search.value = button.dataset.query;
    search();
    elements.search.focus({ preventScroll: true });
  }));
  $('.brand').addEventListener('click', (event) => {
    event.preventDefault();
    if (elements.dictionary.hidden) renderStep(0, { focus: true });
    else { elements.search.value = ''; search(); elements.search.focus(); }
  });

  // Presentation deep links override saved state without resetting the real completion preference.
  const params = new URLSearchParams(location.search);
  const requestedStep = Number(params.get('step'));
  if (params.get('view') === 'home') showDictionary({ persist: false, focus: false });
  else if (params.has('step') && Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= CONTENT.length) renderStep(requestedStep - 1, { speak: false });
  else if (readCompletion()) showDictionary({ persist: false, focus: false });
  else renderStep(0, { speak: false });
})();

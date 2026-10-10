/* Run: node onboarding/validate-state.cjs
 * Executes production app.js in a deliberately minimal DOM model.
 * This verifies state logic, not layout, rendering or assistive technology.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const directory = __dirname;
const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(directory, 'app.js'), 'utf8');
const dataset = fs.readFileSync(path.join(directory, 'demo-dictionary.js'), 'utf8');
const content = JSON.parse(fs.readFileSync(path.join(directory, 'onboarding-content.json'), 'utf8'));

class Element {
  constructor(tag, attributes = {}, document = null) {
    this.tagName = tag.toUpperCase();
    this.attributes = { ...attributes };
    this.dataset = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (key.startsWith('data-')) this.dataset[key.slice(5)] = value;
    }
    this.document = document;
    this.children = [];
    this.events = {};
    this.hidden = Object.hasOwn(attributes, 'hidden');
    this.value = '';
    this.offsetWidth = 100;
    this.classList = {
      add: (value) => { const classes = new Set((this.attributes.class || '').split(' ').filter(Boolean)); classes.add(value); this.attributes.class = [...classes].join(' '); },
      remove: (value) => { this.attributes.class = (this.attributes.class || '').split(' ').filter((name) => name !== value).join(' '); }
    };
  }
  set textContent(text) { this.children = [String(text)]; }
  get textContent() { return this.children.map((child) => typeof child === 'string' ? child : child.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
  dispatch(name, event = {}) { for (const callback of this.events[name] || []) callback({ target: this, preventDefault() {}, ...event }); }
  focus() { this.document.activeElement = this; }
  matches(selector) {
    if (selector.startsWith('#')) return this.attributes.id === selector.slice(1);
    if (selector.startsWith('.')) return (this.attributes.class || '').split(' ').includes(selector.slice(1));
    if (selector.startsWith('[')) {
      const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return match && Object.hasOwn(this.attributes, match[1]) && (match[2] === undefined || this.attributes[match[1]] === match[2]);
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }
  closest(selectors) { return selectors.split(',').some((selector) => this.matches(selector.trim())) ? this : null; }
}

function createRuntime(search = '', saved = false, blockedStorage = false) {
  const document = {
    elements: [], events: {}, title: '', activeElement: null,
    querySelector(selector) { return this.elements.find((element) => element.matches(selector)) || null; },
    querySelectorAll(selector) { return this.elements.filter((element) => element.matches(selector)); },
    createElement(tag) { return new Element(tag, {}, this); },
    createTextNode(text) { return String(text); },
    addEventListener(name, callback) { (this.events[name] ||= []).push(callback); },
    dispatch(name, event) { for (const callback of this.events[name] || []) callback({ preventDefault() {}, ...event }); }
  };
  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)(\s[^<>]*?)?\/?\s*>/gi)) {
    const attributes = {};
    for (const attribute of (match[2] || '').matchAll(/([a-z][\w-]*)(?:="([^"]*)")?/gi)) attributes[attribute[1]] = attribute[2] ?? '';
    document.elements.push(new Element(match[1], attributes, document));
  }
  const values = new Map(saved ? [['entig:onboarding:v1', 'complete']] : []);
  const storage = {
    getItem(key) { if (blockedStorage) throw new Error('Storage disabled'); return values.get(key) ?? null; },
    setItem(key, value) { if (blockedStorage) throw new Error('Storage disabled'); values.set(key, value); },
    removeItem(key) { if (blockedStorage) throw new Error('Storage disabled'); values.delete(key); }
  };
  const context = vm.createContext({ document, window: {}, localStorage: storage, URLSearchParams, location: { search, pathname: '/onboarding/index.html' }, history: { replaceState() {} }, setTimeout(callback) { callback(); return 1; }, clearTimeout() {} });
  vm.runInContext(dataset, context);
  vm.runInContext(script, context);
  return { document, values, $: (selector) => document.querySelector(selector), click: (selector) => document.querySelector(selector).dispatch('click'), key(key, target) { document.dispatch('keydown', { key, target: target || document.querySelector('#next') }); } };
}

function readableText(element) { return element.children.map((child) => typeof child === 'string' ? child : child.tagName === 'BR' ? ' ' : readableText(child)).join(''); }
function step(runtime, expected) {
  assert.equal(runtime.$('#current-step').textContent, String(expected).padStart(2, '0'));
  assert.equal(runtime.$('#onboarding').hidden, false);
  assert.equal(runtime.$('#dictionary').hidden, true);
  assert.equal(readableText(runtime.$('#step-title')), content.steps[expected - 1].title);
  assert.equal(runtime.document.querySelectorAll('[data-step]')[expected - 1].getAttribute('aria-current'), 'step');
}

const runtime = createRuntime();
step(runtime, 1);
assert.equal(runtime.$('#back').hidden, true);
runtime.click('#next'); step(runtime, 2);
assert.equal(runtime.document.activeElement, runtime.$('#step-title'));
runtime.click('#back'); step(runtime, 1);
runtime.key('End'); step(runtime, 3);
runtime.key('Home'); step(runtime, 1);
runtime.key('ArrowRight'); step(runtime, 2);
runtime.key('ArrowLeft'); step(runtime, 1);
runtime.document.querySelectorAll('[data-step]')[2].dispatch('click'); step(runtime, 3);
runtime.key('ArrowLeft', runtime.$('#word-search')); step(runtime, 3);
runtime.click('#next');
assert.equal(runtime.$('#dictionary').hidden, false);
assert.equal(runtime.$('#onboarding').hidden, true);
assert.equal(runtime.values.get('entig:onboarding:v1'), 'complete');
assert.equal(runtime.document.activeElement, runtime.$('#word-search'));
assert.equal(runtime.$('#search-results').children.length, 2);
runtime.$('#word-search').value = 'water';
runtime.$('#word-search').dispatch('input');
assert.equal(runtime.$('#result-count').textContent, '1 word');
assert.match(runtime.$('#search-results').textContent, /ማይ/);
runtime.$('#word-search').value = '<img src=x onerror=alert(1)>';
runtime.$('#word-search').dispatch('input');
assert.equal(runtime.$('#result-count').textContent, '0 words');
assert.match(runtime.$('#search-results').textContent, /No word found/);
runtime.document.querySelectorAll('[data-query]')[0].dispatch('click');
assert.equal(runtime.$('#word-search').value, 'hello');
assert.match(runtime.$('#search-results').textContent, /ሰላም/);
runtime.click('#restart'); step(runtime, 1);
assert.equal(runtime.values.has('entig:onboarding:v1'), false);
runtime.click('#skip');
assert.equal(runtime.$('#dictionary').hidden, false);
assert.equal(runtime.values.get('entig:onboarding:v1'), 'complete');

const returning = createRuntime('', true);
assert.equal(returning.$('#dictionary').hidden, false);
assert.equal(returning.document.activeElement, null);
const presentation = createRuntime('?step=2', true);
step(presentation, 2);
assert.equal(presentation.values.get('entig:onboarding:v1'), 'complete');
const homePreview = createRuntime('?view=home');
assert.equal(homePreview.$('#dictionary').hidden, false);
assert.equal(homePreview.values.size, 0);
const unavailableStorage = createRuntime('', false, true);
unavailableStorage.click('#skip');
assert.equal(unavailableStorage.$('#dictionary').hidden, false);
unavailableStorage.click('#restart'); step(unavailableStorage, 1);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique');
for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  assert.ok(fs.existsSync(path.resolve(directory, match[1].split('?')[0])), `Missing local HTML asset: ${match[1]}`);
}
const css = fs.readFileSync(path.join(directory, 'styles.css'), 'utf8');
for (const match of css.matchAll(/url\("([^"]+)"\)/g)) assert.ok(fs.existsSync(path.resolve(directory, match[1])), `Missing font: ${match[1]}`);
assert.ok(html.includes('role="status"') && html.includes('aria-live="polite"'));
assert.ok(css.includes('prefers-reduced-motion:reduce'));
assert.equal(content.targetLanguage, 'ti');
assert.equal(content.targetDirection, 'ltr');
console.log('PASS: production app.js state transitions, demo searches, storage/deep-link behavior, copy parity, local assets, unique HTML IDs and static semantic checks. Minimal DOM model; browser rendering was not tested.');

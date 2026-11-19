'use strict';

const RED = '#d9001b', DARK = '#1a1a1a', GREY = '#8a8a8a', PINK = '#f3a6af';

const $ = (sel) => document.querySelector(sel);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fmtNum = (n) => Math.round(n).toLocaleString('en-US');

function S(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Activities saved by the Activity page.
   The Activity page saves its list in localStorage under STORE_KEY.
   Each activity looks like this:
     { name, category, date: 'YYYY-MM-DD', day, startTime, duration (min),
       distance (km), calories (kcal), reps?, steps?, weight? }
   reps, steps and weight are optional. When nothing has been saved yet,
   sample activities are shown so the page is never empty. */

const STORE_KEY = 'myfitnessfloors.activities';
const TOTAL_DAYS = 91;
const STEPS_PER_KM = 1312;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


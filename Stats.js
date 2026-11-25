/* MYFITNESS FLOORS JS */
var MFF = (function () {
  //Storage (Wrapped in try/catch
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem("mff." + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem("mff." + key, JSON.stringify(value));
    } catch (e) { /* if storage is not available - the data lasts until the page closes */ }
  }

  function getActivities() { return load("activities", []); }
  function saveActivities(list) { save("activities", list); }
  function getProfile() { return load("profile", null); }
  function saveProfile(p) { save("profile", p); }
  function getWeights() { return load("weights", []); }

  // Keep one weight per day, sorted by date
  function addWeight(date, kg) {
    var list = getWeights().filter(function (w) { return w.date !== date; });
    list.push({ date: date, kg: kg });
    list.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    save("weights", list);
  }

  // Dates (all local time, stored as "YYYY-MM-DD")
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function dayName(s) { return DAYS[parse(s).getDay()]; }
  function shortDate(s) { var d = parse(s); return d.getDate() + " " + MONTHS[d.getMonth()]; }
  function longDate(s) { var d = parse(s); return pad(d.getDate()) + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }

  // Monday of the week that contains date s
  function weekStart(s) {
    var d = parse(s);
    var shift = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - shift);
    return iso(d);
  }

  // Numbers and text 
  function num(n, dp) {
    return Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Steps: using the number logged; otherwise, estimate from distance (about 1,350 steps per km)
  
  // for on-foot activities only - rides, swims and rowing do not count as steps
  function stepsFor(a) {
    if (Number(a.steps) > 0) { return Number(a.steps); }
    if (/cycl|bike|ride|swim|row/i.test(a.name || "")) { return 0; }
    return Math.round((Number(a.distance) || 0) * 1350);
  }

  var CATEGORY_NAMES = {
    cardio: "Cardio", strength: "Strength", pushups: "Push-ups", situps: "Sit-ups",
    squats: "Squats", sports: "Sports", other: "Other"
  };

  // Sample data 
  // A small seeded random generator so the sample looks the same every visit
  function rng(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  function between(r, lo, hi) { return Math.round(lo + r() * (hi - lo)); }

  // About 14 weeks of believable workouts ending today
  function sampleActivities() {
    var r = rng(42);
    var end = today();
    var list = [];
    var id = 1;

    for (var i = 97; i >= 0; i--) {
      var date = addDays(end, -i);
      var rest = i > 0 && r() < 0.22;   // today is always an active day
      if (rest) { continue; }

      var runMin = between(r, 26, 64);
      var km = Math.round(runMin / (5.6 + r()) * 10) / 10;
      list.push({ id: "s" + id++, name: "Morning run", category: "cardio", date: date, time: "07:00",
                  duration: runMin, distance: km, calories: Math.round(runMin * (7.4 + r())), reps: 0 });

      list.push({ id: "s" + id++, name: "Push-ups", category: "pushups", date: date, time: "18:00",
                  duration: 8, distance: 0, calories: between(r, 52, 60), reps: between(r, 30, 44) });
      list.push({ id: "s" + id++, name: "Sit-ups", category: "situps", date: date, time: "18:15",
                  duration: 9, distance: 0, calories: between(r, 55, 62), reps: between(r, 40, 55) });
      list.push({ id: "s" + id++, name: "Squats", category: "squats", date: date, time: "18:30",
                  duration: 10, distance: 0, calories: between(r, 58, 68), reps: between(r, 45, 62) });
    }
    return list;
  }

  function sampleWeights() {
    var r = rng(7);
    var list = [];
    var kg = 79.4;
    for (var i = 96; i >= 0; i -= 2) {
      kg = kg - 0.03 + (r() - 0.5) * 0.35;
      list.push({ date: addDays(today(), -i), kg: Math.round(kg * 10) / 10 });
    }
    return list;
  }

  // Four example workouts for the Activity page, on the last four days
  function exampleWorkouts() {
    var t = today();
    var base = [
      ["Running", "cardio", 40, 6, 480, 0],
      ["Gym Workout", "strength", 60, 0, 400, 0],
      ["Cycling", "cardio", 45, 15, 350, 0],
      ["Swimming", "sports", 40, 1, 100, 0]
    ];
    return base.map(function (b, i) {
      var date = addDays(t, i - 3);
      return { id: "a" + Date.now() + i, name: b[0], category: b[1], date: date, day: dayName(date),
               time: "", duration: b[2], distance: b[3], calories: b[4], reps: b[5], notes: "" };
    });
  }

  // Health maths (shared by Learn and Profile) 
  function bmi(heightCm, weightKg) {
    var m = heightCm / 100;
    var value = weightKg / (m * m);
    var category = value < 18.5 ? "Underweight" : value < 25 ? "Healthy" : value < 30 ? "Overweight" : "Obese";
    return { value: value, category: category };
  }

  // Mifflin-St Jeor formula
  function dailyCalories(age, gender, heightCm, weightKg, activity) {
    var bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (gender === "male" ? 5 : -161);
    return Math.round(bmr * (activity || 1.375));
  }

  return {
    getActivities: getActivities, saveActivities: saveActivities,
    getProfile: getProfile, saveProfile: saveProfile,
    getWeights: getWeights, addWeight: addWeight,
    load: load, save: save,
    iso: iso, parse: parse, today: today, addDays: addDays, dayName: dayName,
    shortDate: shortDate, longDate: longDate, weekStart: weekStart,
    num: num, esc: esc, stepsFor: stepsFor, CATEGORY_NAMES: CATEGORY_NAMES,
    sampleActivities: sampleActivities, sampleWeights: sampleWeights, exampleWorkouts: exampleWorkouts,
    bmi: bmi, dailyCalories: dailyCalories
  };
})();


// Stats page: summary, goal rings, charts, splits, heatmap and records =====
// Everything is built from the activities logged on the Activity page.
// If nothing is logged yet, sample data is shown instead.

var RED = "#d9001b", INK = "#111111", GREY = "#8a8a8a";
var GOALS = { steps: 8000, calories: 500, minutes: 45 };

var logged = MFF.getActivities();
var usingSample = logged.length === 0;
var acts = usingSample ? MFF.sampleActivities() : logged;
var weights = usingSample ? MFF.sampleWeights() : MFF.getWeights();
var TODAY = MFF.today();
var period = 14;

function $(id) { return document.getElementById(id); }

// DAILY TOTALS
var byDate = {};
acts.forEach(function (a) {
  var d = byDate[a.date] || (byDate[a.date] = { calories: 0, minutes: 0, distance: 0, steps: 0, pushups: 0, situps: 0, squats: 0, count: 0 });
  d.calories += Number(a.calories) || 0;
  d.minutes += Number(a.duration) || 0;
  d.distance += Number(a.distance) || 0;
  d.steps += MFF.stepsFor(a);
  d.count += 1;
  if (a.category === "pushups" || a.category === "situps" || a.category === "squats") {
    d[a.category] += Number(a.reps) || 0;
  }
});

// Array of daily totals for the n days ending `end.`
function days(n, end) {
  var out = [];
  for (var i = n - 1; i >= 0; i--) {
    var date = MFF.addDays(end, -i);
    var d = byDate[date] || {};
    out.push({ date: date, calories: d.calories || 0, minutes: d.minutes || 0, distance: d.distance || 0,
               steps: d.steps || 0, pushups: d.pushups || 0, situps: d.situps || 0, squats: d.squats || 0, count: d.count || 0 });
  }
  return out;
}

function pick(list, key) { return list.map(function (d) { return d[key]; }); }
function sum(arr) { return arr.reduce(function (a, b) { return a + b; }, 0); }

// TOOLTIP
var tip = $("tooltip");
function showTip(html, x, y) {
  tip.innerHTML = html;
  tip.style.display = "block";
  var w = tip.offsetWidth, h = tip.offsetHeight;
  var left = Math.min(x + 14, window.innerWidth - w - 8);
  tip.style.left = Math.max(8, left) + "px";
  tip.style.top = Math.max(8, y - h - 12) + "px";
}
function hideTip() { tip.style.display = "none"; }
function tipRow(color, label, value) {
  return '<div class="row"><span class="dot" style="background:' + color + '"></span>' + label + ": <b>" + value + "</b></div>";
}

// SVG HELPERS
var NS = "http://www.w3.org/2000/svg";
var gradId = 0;

function niceMax(v) {
  if (v <= 0) { return 10; }
  var mag = Math.pow(10, Math.floor(Math.log10(v)));
  var steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  for (var i = 0; i < steps.length; i++) { if (steps[i] * mag >= v * 1.1) { return steps[i] * mag; } }
  return 10 * mag;
}

function fmtTick(v, dp) {
  if (dp) { return v.toFixed(dp); }
  return v >= 10000 ? Math.round(v / 1000) + "k" : MFF.num(v);
}

// Line / area chart. opts: { labels, series:[{name,color,values,unit}], height, min, max, dp }
function lineChart(el, opts) {
  var W = el.clientWidth || 600, H = opts.height || 260;
  var m = { l: 50, r: 14, t: 12, b: 28 };
  var iw = W - m.l - m.r, ih = H - m.t - m.b;
  var n = opts.labels.length;
  var all = [].concat.apply([], opts.series.map(function (s) { return s.values; }));
  var min = opts.min != null ? opts.min : 0;
  var max = opts.max != null ? opts.max : niceMax(Math.max.apply(null, all));
  var x = function (i) { return m.l + (n === 1 ? iw / 2 : i * iw / (n - 1)); };
  var y = function (v) { return m.t + ih - (v - min) / (max - min || 1) * ih; };

  var svg = '<svg xmlns="' + NS + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + (opts.aria || "Chart") + '"><defs>';
  opts.series.forEach(function (s) {
    s.gid = "g" + (++gradId);
    svg += '<linearGradient id="' + s.gid + '" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0" stop-color="' + s.color + '" stop-opacity=".3"/><stop offset="1" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient>';
  });
  svg += "</defs>";

  // grid and y labels
  for (var t = 0; t <= 4; t++) {
    var v = min + (max - min) * t / 4, yy = y(v);
    svg += '<line class="grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + yy + '" y2="' + yy + '"/>' +
           '<text class="axis" x="' + (m.l - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + fmtTick(v, opts.dp) + "</text>";
  }
  // x labels (about 7)
  var every = Math.max(1, Math.ceil(n / 7));
  for (var i = 0; i < n; i += every) {
    svg += '<text class="axis" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + MFF.shortDate(opts.labels[i]) + "</text>";
  }
  // series
  opts.series.forEach(function (s) {
    var pts = s.values.map(function (v, i) { return x(i) + "," + y(v); });
    if (n > 1) {
      svg += '<path d="M' + x(0) + "," + y(min) + " L" + pts.join(" L") + " L" + x(n - 1) + "," + y(min) + ' Z" fill="url(#' + s.gid + ')"/>';
    }
    svg += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + s.color + '" stroke-width="2.4" stroke-linejoin="round"/>';
    if (n === 1) { svg += '<circle cx="' + x(0) + '" cy="' + y(s.values[0]) + '" r="4" fill="' + s.color + '"/>'; }
  });
  svg += '<line class="guide hover-line" y1="' + m.t + '" y2="' + (m.t + ih) + '" visibility="hidden"/>';
  opts.series.forEach(function (s, k) {
    svg += '<circle class="hover-dot" data-k="' + k + '" r="5" fill="#fff" stroke="' + s.color + '" stroke-width="2.5" visibility="hidden"/>';
  });
  svg += '<rect class="hit" x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="transparent"/></svg>';
  el.innerHTML = svg;

  // hover
  var hit = el.querySelector(".hit"), line = el.querySelector(".hover-line"), dots = el.querySelectorAll(".hover-dot");
  hit.addEventListener("mousemove", function (e) {
    var r = hit.getBoundingClientRect();
    var i = n === 1 ? 0 : Math.round((e.clientX - r.left) / r.width * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    line.setAttribute("x1", x(i)); line.setAttribute("x2", x(i)); line.setAttribute("visibility", "visible");
    var html = "<strong>" + MFF.shortDate(opts.labels[i]) + "</strong>";
    opts.series.forEach(function (s, k) {
      dots[k].setAttribute("cx", x(i)); dots[k].setAttribute("cy", y(s.values[i])); dots[k].setAttribute("visibility", "visible");
      html += tipRow(s.color, s.name, fmtTick(s.values[i], opts.dp) + (s.unit ? " " + s.unit : ""));
    });
    showTip(html, e.clientX, e.clientY);
  });
  hit.addEventListener("mouseleave", function () {
    line.setAttribute("visibility", "hidden");
    dots.forEach(function (d) { d.setAttribute("visibility", "hidden"); });
    hideTip();
  });
}

// Bar chart with an optional goal line
function barChart(el, opts) {
  var W = el.clientWidth || 600, H = opts.height || 280;
  var m = { l: 50, r: 14, t: 12, b: 28 };
  var iw = W - m.l - m.r, ih = H - m.t - m.b;
  var n = opts.labels.length;
  var max = niceMax(Math.max(Math.max.apply(null, opts.values), opts.goal || 0));
  var slot = iw / n, bw = Math.max(2, slot * 0.7);
  var y = function (v) { return m.t + ih - v / max * ih; };

  var svg = '<svg xmlns="' + NS + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + (opts.aria || "Bar chart") + '">';
  for (var t = 0; t <= 4; t++) {
    var v = max * t / 4;
    svg += '<line class="grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
           '<text class="axis" x="' + (m.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmtTick(v) + "</text>";
  }
  var every = Math.max(1, Math.ceil(n / 6));
  opts.values.forEach(function (v, i) {
    var bx = m.l + i * slot + (slot - bw) / 2;
    svg += '<rect class="bar-rect" data-i="' + i + '" x="' + bx + '" y="' + y(v) + '" width="' + bw + '" height="' + (m.t + ih - y(v)) + '" rx="2" fill="' + opts.color + '"/>';
    if (i % every === 0) {
      svg += '<text class="axis" x="' + (bx + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + MFF.shortDate(opts.labels[i]) + "</text>";
    }
  });
  if (opts.goal) {
    svg += '<line class="goal" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(opts.goal) + '" y2="' + y(opts.goal) + '"/>' +
           '<text class="goal-label" x="' + (W - m.r) + '" y="' + (y(opts.goal) - 5) + '" text-anchor="end">Goal</text>';
  }
  svg += "</svg>";
  el.innerHTML = svg;

  el.querySelectorAll(".bar-rect").forEach(function (b) {
    b.addEventListener("mousemove", function (e) {
      var i = +b.getAttribute("data-i");
      showTip("<strong>" + MFF.shortDate(opts.labels[i]) + "</strong>" + tipRow(opts.color, opts.name, MFF.num(opts.values[i])), e.clientX, e.clientY);
    });
    b.addEventListener("mouseleave", hideTip);
  });
}

function sparkline(values, color) {
  var w = 200, h = 30, n = values.length, max = Math.max.apply(null, values) || 1, min = Math.min.apply(null, values);
  var pts = values.map(function (v, i) {
    return (n === 1 ? w / 2 : i * w / (n - 1)).toFixed(1) + "," + (h - 3 - (v - min) / (max - min || 1) * (h - 6)).toFixed(1);
  });
  return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(" ") +
         '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
}

// 1. Summary tiles
function renderSummary(cur, prev) {
  var tiles = [
    { label: "Activities", key: "count", total: true, unit: "" },
    { label: "Calories / day", key: "calories", unit: "kcal" },
    { label: "Active / day", key: "minutes", unit: "min" },
    { label: "Distance / day", key: "distance", unit: "km", dp: 1 },
    { label: "Steps / day", key: "steps", unit: "" }
  ];
  $("summary").innerHTML = tiles.map(function (t) {
    var a = sum(pick(cur, t.key)), b = sum(pick(prev, t.key));
    var value = t.total ? a : a / cur.length;
    var delta;
    if (b === 0) {
      delta = '<p class="delta flat">No earlier data</p>';
    } else {
      var pct = (a - b) / b * 100;
      var cls = Math.abs(pct) < 0.05 ? "flat" : pct > 0 ? "good" : "bad";
      var arrow = cls === "flat" ? "&mdash;" : pct > 0 ? "&#9650;" : "&#9660;";
      delta = '<p class="delta ' + cls + '">' + arrow + " " + Math.abs(pct).toFixed(1) + "% vs previous " + period + " days</p>";
    }
    return '<div class="stat"><p class="label">' + t.label + '</p><p class="value">' + MFF.num(value, t.dp) +
      (t.unit ? '<span class="unit">' + t.unit + "</span>" : "") + "</p>" + delta + sparkline(pick(cur, t.key), RED) + "</div>";
  }).join("");
}

// 2. Today's goal rings
function renderRings() {
  var t = days(1, TODAY)[0];
  var rings = [
    { label: "Steps", value: t.steps, goal: GOALS.steps, unit: "" },
    { label: "Calories burnt", value: t.calories, goal: GOALS.calories, unit: " kcal" },
    { label: "Active time", value: t.minutes, goal: GOALS.minutes, unit: " min" }
  ];
  var C = 2 * Math.PI * 42;
  $("rings").innerHTML = rings.map(function (r) {
    var pct = Math.min(100, Math.round(r.value / r.goal * 100));
    return '<div class="ring"><svg viewBox="0 0 110 110" role="img" aria-label="' + r.label + " " + pct + '% of goal">' +
      '<circle class="ring-bg" cx="55" cy="55" r="42"/>' +
      '<circle class="ring-fg" cx="55" cy="55" r="42" stroke-dasharray="' + (C * pct / 100) + " " + C + '" transform="rotate(-90 55 55)"' +
      (pct === 0 ? ' visibility="hidden"' : "") + "/>" +
      '<text class="ring-text" x="55" y="63">' + pct + "%</text></svg>" +
      '<p class="ring-label">' + r.label + '</p><p class="ring-sub">' + MFF.num(r.value) + " / " + MFF.num(r.goal) + r.unit + "</p></div>";
  }).join("");
}

// 3. Charts 
function renderCharts(cur) {
  var labels = pick(cur, "date");

  $("legend-calories").innerHTML = '<span class="key"><i style="background:' + RED + '"></i>Calories burnt</span>';
  lineChart($("chart-calories"), { labels: labels, aria: "Calories burnt per day",
    series: [{ name: "Calories", color: RED, values: pick(cur, "calories"), unit: "kcal" }] });

  barChart($("chart-steps"), { labels: labels, values: pick(cur, "steps"), goal: GOALS.steps, color: RED, name: "Steps", aria: "Steps per day" });

  var reps = [["pushups", "Push-ups", RED], ["situps", "Sit-ups", INK], ["squats", "Squats", GREY]];
  var box = $("chart-reps");
  box.innerHTML = reps.map(function (r) {
    return '<div class="mini"><p class="mini-title"><i style="background:' + r[2] + '"></i>' + r[1] + '</p><div class="chart" id="mini-' + r[0] + '"></div></div>';
  }).join("");
  reps.forEach(function (r) {
    lineChart($("mini-" + r[0]), { labels: labels, height: 150, aria: r[1] + " per day",
      series: [{ name: r[1], color: r[2], values: pick(cur, r[0]), unit: "reps" }] });
  });

  // Body weight: entries inside the period, or the last 10 if there are fewer than 2
  var from = MFF.addDays(TODAY, -(period - 1));
  var w = weights.filter(function (x) { return x.date >= from && x.date <= TODAY; });
  if (w.length < 2) { w = weights.filter(function (x) { return x.date <= TODAY; }).slice(-10); }
  var wEl = $("chart-weight");
  if (w.length === 0) {
    wEl.innerHTML = '<p class="empty">No weight saved yet. Add your weight on the <a href="../profile/profile.html">Profile</a> page.</p>';
  } else {
    var kg = w.map(function (x) { return x.kg; });
    var lo = Math.min.apply(null, kg), hi = Math.max.apply(null, kg);
    var pad = Math.max(0.3, (hi - lo) * 0.15);
    lineChart(wEl, { labels: w.map(function (x) { return x.date; }), height: 280, min: Math.floor((lo - pad) * 10) / 10,
      max: Math.ceil((hi + pad) * 10) / 10, dp: 1, aria: "Body weight",
      series: [{ name: "Weight", color: RED, values: kg, unit: "kg" }] });
  }
}

// 4. Workout splits (last 5 sessions) 
function renderSplits() {
  var last = acts.filter(function (a) { return a.date <= TODAY; }).sort(function (a, b) {
    return (a.date + (a.time || "")) < (b.date + (b.time || "")) ? -1 : 1;
  }).slice(-5);
  var n = last.length;
  document.querySelectorAll(".split-cols, .split-bars").forEach(function (el) { el.style.setProperty("--n", Math.max(n, 1)); });

  if (n === 0) {
    $("split-head").innerHTML = '<p class="empty">No sessions yet.</p>';
    $("split-bars").innerHTML = $("split-dist").innerHTML = "";
    return;
  }

  $("split-head").innerHTML = last.map(function (a, i) {
    return '<div class="split-head-cell"><b>' + (i + 1) + "</b>" + a.duration + ' min<span class="split-name">' + MFF.esc(a.name) + "</span></div>";
  }).join("");

  function bars(el, key, dp) {
    var vals = last.map(function (a) { return Number(a[key]) || 0; });
    var max = Math.max.apply(null, vals);
    if (max === 0) { el.innerHTML = '<p class="empty" style="grid-column:1/-1;align-self:center">None of these sessions has a ' + (key === "distance" ? "distance" : "calorie count") + ".</p>"; return; }
    var avg = sum(vals) / n;
    el.innerHTML = vals.map(function (v, i) {
      if (v === 0) { return '<div class="split-bar-col"></div>'; }
      return '<div class="split-bar-col"><div class="split-bar" title="' + MFF.esc(last[i].name) + " · " + MFF.shortDate(last[i].date) +
        '" style="height:' + Math.max(18, v / max * 100) + '%">' + MFF.num(v, dp) + "</div></div>";
    }).join("") + '<div class="split-avg" style="bottom:' + (avg / max * 100) + '%"><span>avg ' + MFF.num(avg, dp) + "</span></div>";
  }
  bars($("split-bars"), "calories", 0);
  bars($("split-dist"), "distance", 1);
}

// 5. All data table 
function renderTable(cur) {
  var rows = cur.slice().reverse().map(function (d) {
    return "<tr><td>" + MFF.dayName(d.date).slice(0, 3) + " " + MFF.shortDate(d.date) + "</td><td>" + d.count + "</td><td>" + d.minutes +
      " min</td><td>" + MFF.num(d.distance, 1) + " km</td><td>" + MFF.num(d.calories) + "</td><td>" + MFF.num(d.steps) +
      "</td><td>" + d.pushups + "</td><td>" + d.situps + "</td><td>" + d.squats + "</td></tr>";
  }).join("");
  $("data-table").innerHTML = "<table><thead><tr><th>Day</th><th>Activities</th><th>Active</th><th>Distance</th><th>Calories</th>" +
    "<th>Steps</th><th>Push-ups</th><th>Sit-ups</th><th>Squats</th></tr></thead><tbody>" + rows + "</tbody></table>";
}

$("toggle-data").addEventListener("click", function () {
  var open = this.getAttribute("aria-expanded") === "true";
  this.setAttribute("aria-expanded", String(!open));
  this.querySelector("span").textContent = open ? "View All Data" : "Hide Data";
  $("data-table").hidden = open;
});


// 7. Personal records 
function renderRecords() {
  var dates = Object.keys(byDate).filter(function (d) { return d <= TODAY; });
  function best(key) {
    var top = null;
    dates.forEach(function (d) { if (byDate[d][key] > 0 && (!top || byDate[d][key] > byDate[top][key])) { top = d; } });
    return top;
  }
  var items = [];
  [["pushups", "Most push-ups in a day"], ["situps", "Most sit-ups in a day"], ["squats", "Most squats in a day"], ["steps", "Most steps in a day"]]
    .forEach(function (r) {
      var d = best(r[0]);
      if (d) { items.push([r[1], MFF.shortDate(d), MFF.num(byDate[d][r[0]])]); }
    });

  var streak = 0, longest = 0;
  days(91, TODAY).forEach(function (d) { streak = d.steps >= GOALS.steps ? streak + 1 : 0; longest = Math.max(longest, streak); });
  items.push(["Longest " + MFF.num(GOALS.steps) + "-step streak", "in the last 13 weeks", longest + (longest === 1 ? " day" : " days")]);

  var longestAct = acts.filter(function (a) { return a.date <= TODAY; })
    .reduce(function (top, a) { return !top || Number(a.duration) > Number(top.duration) ? a : top; }, null);
  if (longestAct) { items.push(["Longest single activity", MFF.esc(longestAct.name) + ", " + MFF.shortDate(longestAct.date), longestAct.duration + " min"]); }

  $("records").innerHTML = items.map(function (r) {
    return "<li><span>" + r[0] + "<small>" + r[1] + "</small></span><b>" + r[2] + "</b></li>";
  }).join("");
}

// Draw everything 
function render() {
  var cur = days(period, TODAY);
  var prev = days(period, MFF.addDays(TODAY, -period));
  renderSummary(cur, prev);
  renderCharts(cur);
  renderTable(cur);
}

$("data-note").textContent = usingSample
  ? "Showing sample data. Log activities on the Activity page and they will appear here."
  : "Showing your " + MFF.num(logged.length) + " logged " + (logged.length === 1 ? "activity" : "activities") + ".";

document.querySelectorAll(".tab").forEach(function (tab) {
  tab.setAttribute("role", "tab");
  tab.addEventListener("click", function () {
    period = Number(tab.getAttribute("data-days"));
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", String(t === tab));
    });
    render();
  });
});

render();
renderRings();
renderSplits();
renderHeatmap();
renderRecords();

// Redraw charts when the window is resized
var resizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () { renderCharts(days(period, TODAY)); }, 150);
});

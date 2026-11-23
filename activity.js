/* =====================================================================
   MYFITNESSFLOORS - shared helpers used by every page
   - Saves activities, profile and weight in this browser (localStorage)
   - Date and number helpers
   - Sample data for the Stats page when nothing is logged yet
   ===================================================================== */

var MFF = (function () {

  // ---------- Storage (wrapped in try/catch so private mode does not break the page) ----------
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
    } catch (e) { /* storage not available - data lasts until the page closes */ }
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

  // ---------- Dates (all local time, stored as "YYYY-MM-DD") ----------
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

  // ---------- Numbers and text ----------
  function num(n, dp) {
    return Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Steps: use the number logged, otherwise estimate from distance (about 1,350 steps per km)
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

  // ---------- Sample data ----------
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

  // ---------- Health maths (shared by Learn and Profile) ----------
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


// ===== Activity page: add, edit, delete and list workouts =====

var activities = MFF.getActivities();
var editingId = null;
var shownWeek = MFF.weekStart(MFF.today());

var form = document.getElementById("activity-form");
var dateInput = document.getElementById("date");
var dayInput = document.getElementById("day");
var message = document.getElementById("form-message");

function field(id) { return document.getElementById(id); }

// ---------- Summary tiles ----------
function renderSummary() {
  var minutes = 0, calories = 0, days = {};
  activities.forEach(function (a) {
    minutes += Number(a.duration) || 0;
    calories += Number(a.calories) || 0;
    days[a.date] = true;
  });
  field("sum-count").textContent = MFF.num(activities.length);
  field("sum-duration").textContent = MFF.num(minutes);
  field("sum-calories").textContent = MFF.num(calories);
  field("sum-days").textContent = MFF.num(Object.keys(days).length);
}

// ---------- History table (newest first) ----------
function sorted() {
  return activities.slice().sort(function (a, b) {
    return (b.date + (b.time || "")) < (a.date + (a.time || "")) ? -1 : 1;
  });
}

function renderHistory() {
  var body = field("history-body");

  if (activities.length === 0) {
    body.innerHTML = '<tr><td colspan="7" class="empty" style="border-left:0;font-weight:400">' +
      'No activities yet. Fill in the form to log your first workout, or ' +
      '<button type="button" class="text-btn" id="add-samples">add 4 sample workouts</button></td></tr>';
    field("add-samples").addEventListener("click", function () {
      activities = activities.concat(MFF.exampleWorkouts());
      saveAndRender();
    });
    return;
  }

  body.innerHTML = sorted().map(function (a) {
    return "<tr>" +
      "<td>" + MFF.longDate(a.date) + "</td>" +
      "<td>" + MFF.dayName(a.date) + "</td>" +
      "<td>" + MFF.esc(a.name) + (a.reps ? ' <span class="muted small">(' + a.reps + " reps)</span>" : "") + "</td>" +
      "<td>" + a.duration + " min</td>" +
      "<td>" + (a.distance ? a.distance + " km" : "-") + "</td>" +
      "<td>" + (a.calories ? MFF.num(a.calories) + " kcal" : "-") + "</td>" +
      '<td><button type="button" class="text-btn" data-edit="' + a.id + '">Edit</button> &nbsp;' +
      '<button type="button" class="text-btn danger" data-delete="' + a.id + '">Delete</button></td>' +
      "</tr>";
  }).join("");
}

field("history-body").addEventListener("click", function (e) {
  var editId = e.target.getAttribute("data-edit");
  var deleteId = e.target.getAttribute("data-delete");
  if (editId) { startEdit(editId); }
  if (deleteId) {
    // Ask in the page: first click turns the button into "Confirm delete", second click deletes
    if (e.target.getAttribute("data-armed") !== "yes") {
      e.target.setAttribute("data-armed", "yes");
      e.target.textContent = "Confirm delete";
      setTimeout(function () {
        if (e.target.isConnected) { e.target.removeAttribute("data-armed"); e.target.textContent = "Delete"; }
      }, 4000);
      return;
    }
    activities = activities.filter(function (x) { return x.id !== deleteId; });
    if (editingId === deleteId) { resetForm(); }
    saveAndRender();
  }
});

// ---------- Weekly overview ----------
function renderWeek() {
  field("week-label").textContent = "Week of " + MFF.shortDate(shownWeek);
  var rows = "";
  for (var i = 0; i < 7; i++) {
    var date = MFF.addDays(shownWeek, i);
    var names = activities.filter(function (a) { return a.date === date; })
                          .map(function (a) { return MFF.esc(a.name); });
    var done = names.length > 0;
    rows += '<tr class="' + (date === MFF.today() ? "today" : "") + '">' +
      "<td>" + MFF.dayName(date) + "</td>" +
      "<td>" + (done ? names.join(", ") : "-") + "</td>" +
      '<td><span class="pill ' + (done ? "done" : "") + '">' + (done ? "Done" : "Not recorded") + "</span></td></tr>";
  }
  field("week-body").innerHTML = rows;
}

field("prev-week").addEventListener("click", function () { shownWeek = MFF.addDays(shownWeek, -7); renderWeek(); });
field("next-week").addEventListener("click", function () { shownWeek = MFF.addDays(shownWeek, 7); renderWeek(); });

// ---------- Form ----------
function syncDay() {
  if (dateInput.value) { dayInput.value = MFF.dayName(dateInput.value); }
}
dateInput.addEventListener("change", syncDay);

function resetForm() {
  form.reset();
  editingId = null;
  dateInput.value = MFF.today();
  syncDay();
  field("form-title").textContent = "Add new activity";
  field("submit-btn").textContent = "Add activity";
  field("cancel-btn").hidden = true;
}

function startEdit(id) {
  var a = activities.find(function (x) { return x.id === id; });
  if (!a) { return; }
  editingId = id;
  field("name").value = a.name;
  field("category").value = a.category;
  dateInput.value = a.date;
  syncDay();
  field("time").value = a.time || "";
  field("duration").value = a.duration;
  field("distance").value = a.distance || "";
  field("calories").value = a.calories || "";
  field("reps").value = a.reps || "";
  field("steps").value = a.steps || "";
  field("notes").value = a.notes || "";
  field("form-title").textContent = "Edit activity";
  field("submit-btn").textContent = "Save changes";
  field("cancel-btn").hidden = false;
  message.textContent = "";
  field("add-activity").scrollIntoView({ behavior: "smooth", block: "start" });
  field("name").focus({ preventScroll: true });
}

field("cancel-btn").addEventListener("click", function () { resetForm(); message.textContent = ""; });

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  var entry = {
    id: editingId || "a" + Date.now(),
    name: field("name").value.trim(),
    category: field("category").value,
    date: dateInput.value,
    day: MFF.dayName(dateInput.value),
    time: field("time").value,
    duration: Number(field("duration").value),
    distance: Number(field("distance").value) || 0,
    calories: Number(field("calories").value) || 0,
    reps: Number(field("reps").value) || 0,
    steps: Number(field("steps").value) || 0,
    notes: field("notes").value.trim()
  };

  if (editingId) {
    activities = activities.map(function (a) { return a.id === editingId ? entry : a; });
    message.textContent = "Changes saved.";
  } else {
    activities.push(entry);
    message.textContent = '"' + entry.name + '" added.';
  }
  message.className = "span-2 toast";

  shownWeek = MFF.weekStart(entry.date);
  resetForm();
  saveAndRender();
});

function saveAndRender() {
  MFF.saveActivities(activities);
  renderSummary();
  renderHistory();
  renderWeek();
}

// Start
resetForm();
saveAndRender();

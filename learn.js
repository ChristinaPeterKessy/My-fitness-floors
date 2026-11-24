// filtering the activity cards by goal
var MFF = (function () {

  //  Storage
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

  // Keeping one weight per day, sorted by date
  function addWeight(date, kg) {
    var list = getWeights().filter(function (w) { return w.date !== date; });
    list.push({ date: date, kg: kg });
    list.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    save("weights", list);
  }

  // Dates (all local time )
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

  //  Numbers and text 
  function num(n, dp) {
    return Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Steps use the number logged
  // for on-foot activities only
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

  // Health maths
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


//Learn page: activity cards, tips, weekly plan and health tools

function $(id) { return document.getElementById(id); }

//  Filter the activity cards by goal 
var cards = document.querySelectorAll(".activity-card");
var filterButtons = document.querySelectorAll("#filters .chip");

function filterCards(goal) {
  cards.forEach(function (card) {
    var goals = card.getAttribute("data-goal").split(" ");
    card.hidden = !(goal === "all" || goals.indexOf(goal) !== -1);
  });
  filterButtons.forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-goal") === goal);
  });
}

filterButtons.forEach(function (b) {
  b.addEventListener("click", function () { filterCards(b.getAttribute("data-goal")); });
});

// Clicking a card opens its "How to start" tips
cards.forEach(function (card) {
  function open() {
    $("tipSelect").value = card.getAttribute("data-tip");
    showTips();
    $("how-to-start").scrollIntoView({ behavior: "smooth" });
  }
  card.addEventListener("click", open);
  card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
});

//  How to start
var tips = {
  jogging: ["Walk for 5 minutes first.", "Keep your back straight and your steps light.", "Starting too fast. Go slow and build up."],
  running: ["Jog gently for 5-10 minutes.", "Land under your hips, relax your shoulders and swing your arms.", "Adding distance too quickly. Increase by about 10% a week."],
  walking: ["Start at an easy pace for a few minutes.", "Stand tall, look ahead and roll from heel to toe.", "Wearing worn-out or unsupportive shoes."],
  cycling: ["Pedal easily in a low gear for 5 minutes.", "Set the saddle so your knee is slightly bent at the bottom.", "Riding with a saddle that is too low."],
  yoga: ["Do a few gentle stretches.", "Breathe slowly and never force a pose.", "Holding your breath."],
  strength: ["5 minutes of light cardio.", "Use light weights first and focus on clean movement.", "Lifting too heavy too soon."]
};

function showTips() {
  var t = tips[$("tipSelect").value];
  $("tipText").innerHTML = t
    ? "<p><b>Warm-up:</b> " + t[0] + "</p><p><b>Form:</b> " + t[1] + "</p><p><b>Mistake to avoid:</b> " + t[2] + "</p>"
    : '<p class="muted">Pick an activity to see a warm-up, good form and the mistake to avoid.</p>';
}
$("tipSelect").addEventListener("change", showTips);


function showPlan(choice) {
  $("planBody").innerHTML = plans[choice].map(function (row) {
    return "<tr><td><strong>" + row[0] + "</strong></td><td>" + row[1] + "</td></tr>";
  }).join("");
  document.querySelectorAll("#planButtons .chip").forEach(function (b) {
    b.classList.toggle("active", b.getAttribute("data-plan") === choice);
  });
}
document.querySelectorAll("#planButtons .chip").forEach(function (b) {
  b.addEventListener("click", function () { showPlan(b.getAttribute("data-plan")); });
});

//  BMI 
function calculateBMI() {
  var h = Number($("bmiHeight").value), w = Number($("bmiWeight").value);
  if (h <= 0 || w <= 0) { $("bmiResult").textContent = "Please enter your height and weight."; return; }
  var r = MFF.bmi(h, w);
  $("bmiResult").innerHTML = "Your BMI is " + r.value.toFixed(1) + " (" + r.category + ")" +
    "<small>Healthy range is 18.5 to 24.9.</small>";
}
$("bmiBtn").addEventListener("click", calculateBMI);

//  Calories 
function calculateCalories() {
  var age = Number($("calAge").value), h = Number($("calHeight").value), w = Number($("calWeight").value);
  if (age <= 0 || h <= 0 || w <= 0) { $("calResult").textContent = "Please fill in all the boxes."; return; }
  var maintain = MFF.dailyCalories(age, $("calGender").value, h, w, Number($("calActivity").value));
  $("calResult").innerHTML = "Maintain weight: " + MFF.num(maintain) + " kcal/day" +
    "<small>Lose weight: about " + MFF.num(maintain - 500) + " kcal/day &middot; Gain weight: about " +
    MFF.num(maintain + 500) + " kcal/day</small>";
}
$("calBtn").addEventListener("click", calculateCalories);

//  Water 
var water = MFF.load("water", { date: MFF.today(), glasses: 0 });
if (water.date !== MFF.today()) { water = { date: MFF.today(), glasses: 0 }; }

function updateWater() {
  $("glassCount").textContent = water.glasses;
  $("waterBar").style.width = Math.min(water.glasses / 8 * 100, 100) + "%";
  MFF.save("water", water);
}
$("addGlass").addEventListener("click", function () { water.glasses++; updateWater(); });
$("resetWater").addEventListener("click", function () { water.glasses = 0; updateWater(); });




  
//  Fill the tools from the saved profile 
var profile = MFF.getProfile();
if (profile) {
  $("bmiHeight").value = profile.height || "";
  $("bmiWeight").value = profile.weight || "";
  $("calAge").value = profile.age || "";
  $("calGender").value = profile.gender || "male";
  $("calHeight").value = profile.height || "";
  $("calWeight").value = profile.weight || "";
  $("profile-note").textContent = "Filled in from your profile.";
  if (profile.height && profile.weight) { calculateBMI(); }
  if (profile.age && profile.height && profile.weight) { calculateCalories(); }
} else {
  $("profile-note").innerHTML = '<a href="../profile/profile.html">Save your profile</a> to fill these in automatically.';
}

//  Start

var goalParam = new URLSearchParams(location.search).get("goal");
filterCards(["weight", "stamina", "stress", "strength"].indexOf(goalParam) !== -1 ? goalParam : "all");
showPlan("beginner");
showFoods();
updateWater();
 

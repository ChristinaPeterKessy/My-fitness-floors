// filtering the activity cards by goal
function filterCards(goal) {
  var cards = document.querySelectorAll(".card");

  for(var i = 0; i < cards.length; i++) {
    var goals = cards[i].getAttribute("data-goal");

    if(goal === "all" || goals.indexOf(goal) !== -1) {
      cards[i].style.display = "block";
    } else{
      cards[i].style.display = "none";
    }
  }
}

//"How to start " tips
var tips = {
  jogging: "<b>Warm-up:</b>Walk for 5 minutes first.<br>" + 
           "<b>Form:</b>Keep your back straight and your steps light.<br>" +
            "<b>Mistake to avoid:</b> Starting too fast. Go slow and build up.",
  yoga: "<b>Warm-up:</b> Do a fe gentle stretches.<br>" + 
         "<b>Form:</b> Breathe slowly and never force a pose.<br>"
         + "<b>Mistake to avoid:</b> Holding your breath.",
  strength: "<b>Warm-up:</b> 5 minutes of light cardio.<br>" +
          "<b>Form:</b> Use light weights first and focus on clean movement.<br>" +
         "<b>Mistake to avoid:</b> Lifting too heavy too soon."
};

function showTips() {
  var choice =  document.getElementById("tipSelect").value;
  var box = document.getElementById("tipText");

  if (choice == ""){
    box.innerHTML = "":
  } else {
    box.innerHTML = "<p>" + tips[choice] + "</p>";
  }
}

// Weekly plans
var plans = {
  beginner: [
    ["Monday", "20 minute walk"],
    ["Tuesday", "Rest"],
    ["Wednesday", "15 minute light jog"],
    ["Thursday", "Rest"],
    ["Friday", "20 minute walk"],
    ["Saturday", "Yoga (20 minutes)"],
    ["Sunday", "Rest"]
  ],
  intermediate: [
    ["Monday", "30 minute run"],
    ["Tuesday", "Strength training"],
    ["Wednesday", "Yoga (30 minutes)"],
    ["Thursday", "30 minute run"],
    ["Friday", "Strength training"],
    ["Saturday", "45 minute cycling"],
    ["Sunday", "Rest"]
  ]
};

  



  

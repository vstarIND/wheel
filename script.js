const socket = io("http://localhost:3000"); // Replace with your server IP/domain

let canvas = document.getElementById("wheel");
let ctx = canvas.getContext("2d");
let countdownEl = document.getElementById("countdown");
let prizeEl = document.getElementById("prize");
let winnersTable = document.querySelector("#winners tbody");
let currentTickets = {};

// Draw the spinning wheel every second with updated data
let angle = 0;
function drawWheel(tickets) {
  let total = Object.values(tickets).reduce((a, b) => a + b, 0);
  if (total === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText("No participants", 150, 200);
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let startAngle = angle;
  Object.entries(tickets).forEach(([name, count]) => {
    let slice = (count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.arc(200, 200, 180, startAngle, startAngle + slice);
    ctx.fillStyle = "#" + Math.floor(Math.random()*16777215).toString(16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(startAngle + slice / 2);
    ctx.fillText(name, 100, 0);
    ctx.restore();
    startAngle += slice;
  });
  angle += 0.02; // Spin speed
}

// Countdown timer to top of next hour
function updateCountdown() {
  let now = new Date();
  let nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(now.getHours() + 1);
  let diff = nextHour - now;
  let hours = Math.floor(diff / 1000 / 60 / 60);
  let minutes = Math.floor((diff / 1000 / 60) % 60);
  let seconds = Math.floor((diff / 1000) % 60);
  countdownEl.textContent = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
setInterval(updateCountdown, 1000);

// Fetch prize pool & winners table every 10s
async function refreshData() {
  const prize = await fetch("/api/prizepool").then(r => r.json());
  prizeEl.textContent = prize.prize;
  const winners = await fetch("/api/winners").then(r => r.json());
  winnersTable.innerHTML = "";
  Object.entries(winners).reverse().forEach(([time, w]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${time}</td><td>${w.winner}</td><td>${w.tickets}</td><td>${w.participants}</td><td>$${w.prize}</td>`;
    winnersTable.appendChild(tr);
  });
}
setInterval(refreshData, 10000);

// Listen for live updates
socket.on("tickets", (data) => {
  currentTickets = data;
});

// Draw loop
function drawLoop() {
  drawWheel(currentTickets);
  requestAnimationFrame(drawLoop);
}
drawLoop();

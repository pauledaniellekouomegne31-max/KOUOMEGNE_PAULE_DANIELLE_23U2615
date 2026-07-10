const GOLD         = "#C9A84C";
const GOLD_LIGHT   = "#E8C97A";
const ACCENT       = "#E8534A";
const SUCCESS      = "#4CAF7D";
const MUTED        = "#9A9490";
const CARD_BG      = "#1E1E1E";

const PALETTE = [
  "#C9A84C", "#E8534A", "#4CAF7D", "#6B9FD4",
  "#E8A84C", "#A84CE8", "#4CE8C9", "#E84CA8",
  "#8BC34A", "#FF9800"
];

Chart.defaults.color = "#9A9490";
Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
Chart.defaults.font.family = "'DM Sans', sans-serif";

let charts = {};

document.addEventListener("DOMContentLoaded", loadStats);

async function loadStats() {
  document.getElementById("loader").style.display = "block";
  document.getElementById("kpiGrid").style.opacity = "0.3";

  try {
    const res = await fetch("/api/stats");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    const data = await res.json();
    document.getElementById("loader").style.display = "none";
    document.getElementById("kpiGrid").style.opacity = "1";

    if (data.total === 0) {
      document.getElementById("kpiTotal").textContent = "0";
      document.getElementById("kpiPrix").textContent = "—";
      document.getElementById("kpiNote").textContent = "—";
      document.getElementById("kpiVille").textContent = "—";
      return;
    }

    renderKPIs(data);
    renderPrestations(data.prestations);
    renderSexe(data.sexe);
    renderPrix(data.prix_par_coiffure);
    renderPaiement(data.paiement);
    renderRadar(data.notes_moyennes);
    renderReco(data.recommandation);
    renderEvolution(data.evolution);
    renderVilles(data.villes);

  } catch (err) {
    document.getElementById("loader").innerHTML = 
      <p style="color:#E8534A">Erreur de chargement des données.<br/>
      <button onclick="loadStats()" style="margin-top:12px;padding:8px 18px;background:#C9A84C;color:#0F0F0F;border:none;border-radius:50px;cursor:pointer;">Réessayer</button></p>
    ;
  }
}

function renderKPIs(data) {
  document.getElementById("kpiTotal").textContent = data.total.toLocaleString("fr-FR");
  document.getElementById("kpiPrix").textContent  = data.prix_moyen ? data.prix_moyen.toLocaleString("fr-FR") : "—";
  document.getElementById("kpiNote").textContent  = data.note_moyenne ? ${data.note_moyenne} ⭐ : "—";
  document.getElementById("kpiVille").textContent = data.ville_top || "—";
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ── Graphique 1 : Prestations ──
function renderPrestations(data) {
  destroyChart("prestations");
  const labels = Object.keys(data);
  const values = Object.values(data);

  charts["prestations"] = new Chart(document.getElementById("chartPrestations"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Nombre de clients",
        data: values,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + "CC"),
        borderColor:      labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.04)" } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── Graphique 2 : Sexe ──
function renderSexe(data) {
  destroyChart("sexe");
  charts["sexe"] = new Chart(document.getElementById("chartSexe"), {
    type: "doughnut",
    data: {
      labels: Object.keys(data),datasets: [{
        data: Object.values(data),
        backgroundColor: [GOLD + "CC", ACCENT + "CC", SUCCESS + "CC"],
        borderColor:     [GOLD, ACCENT, SUCCESS],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8 }
        }
      }
    }
  });
}

// ── Graphique 3 : Prix par coiffure ──
function renderPrix(data) {
  destroyChart("prix");
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(e => e[0]);
  const values = sorted.map(e => e[1]);

  charts["prix"] = new Chart(document.getElementById("chartPrix"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Prix moyen (FCFA)",
        data: values,
        backgroundColor: GOLD + "99",
        borderColor: GOLD,
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx =>  ${ctx.parsed.x.toLocaleString("fr-FR")} FCFA
          }
        }
      },scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { callback: v => v.toLocaleString("fr-FR") }
        },y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── Graphique 4 : Paiement ──
function renderPaiement(data) {
  destroyChart("paiement");
  charts["paiement"] = new Chart(document.getElementById("chartPaiement"), {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [SUCCESS + "CC", GOLD + "CC", ACCENT + "CC"],
        borderColor:     [SUCCESS, GOLD, ACCENT],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 16, usePointStyle: true }
        }
      }
    }
  });
}

// ── Graphique 5 : Radar satisfaction ──
function renderRadar(data) {
  destroyChart("radar");
  charts["radar"] = new Chart(document.getElementById("chartRadar"), {
    type: "radar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Moyenne /5",
        data: Object.values(data),
        backgroundColor: GOLD + "22",
        borderColor: GOLD,
        borderWidth: 2,
        pointBackgroundColor: GOLD,
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 5,
          ticks: { stepSize: 1, backdropColor: "transparent", font: { size: 10 } },
          grid: { color: "rgba(255,255,255,0.06)" },
          angleLines: { color: "rgba(255,255,255,0.06)" },
          pointLabels: { font: { size: 11 } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// ── Graphique 6 : Recommandation ──
function renderReco(data) {
  destroyChart("reco");
  charts["reco"] = new Chart(document.getElementById("chartReco"), {
    type: "doughnut",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [SUCCESS + "CC", ACCENT + "CC", GOLD + "CC"],
        borderColor:     [SUCCESS, ACCENT, GOLD],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 16, usePointStyle: true }
        }
      }
    }
  });
}

// ── Graphique 7 : Évolution temporelle ──
function renderEvolution(data) {
  destroyChart("evolution");
  const labels = Object.keys(data).sort();
  const values = labels.map(d => data[d]);
  charts["evolution"] = new Chart(document.getElementById("chartEvolution"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Soumissions",
        data: values,
        borderColor: GOLD,
        backgroundColor: GOLD + "18",
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: GOLD,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { stepSize: 1 },
          beginAtZero: true
        }
      }
    }
  });
}

// ── Graphique 8 : Villes ──
function renderVilles(data) {
  destroyChart("villes");
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(e => e[0]);
  const values = sorted.map(e => e[1]);

  charts["villes"] = new Chart(document.getElementById("chartVilles"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Nombre de réponses",
        data: values,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + "BB"),
        borderColor:     labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1.5,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { stepSize: 1 },
          beginAtZero: true
        }
      }
    }
  });
}
      
// Main application controller
class App {
  constructor() {
    this.subjectId = null;
    this.sessionData = [];
    this.init();
  }

  init() {
    // Show ID input first
    new IDInput((subjectId) => {
      this.subjectId = subjectId;
      this.startTests();
    });
  }

  async startTests() {
    // Run both tests with orchestrator
    const orchestrator = new TestOrchestrator(this.subjectId, (data) => {
      this.sessionData = data;
      this.showCompletionScreen();
    });
    await orchestrator.start();
  }

  showCompletionScreen() {
    const container = document.getElementById("app");

    // Calculate statistics
    const stats = StatisticsCalculator.calculateStats(this.sessionData);

    // Build statistics display
    let statsHTML = "";
    if (stats) {
      if (stats.sart) {
        statsHTML += this.buildSARTStatsHTML(stats.sart);
      }
      if (stats.nback) {
        statsHTML += this.buildNBackStatsHTML(stats.nback);
      }
    }

    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-black text-white px-6 py-8">
        <div class="w-full max-w-7xl">
          <div class="glass-container rounded-lg p-8">
            <div class="flex flex-col lg:flex-row gap-6">
              ${statsHTML}
            </div>
            <div class="flex gap-4 justify-center mt-8">
              <button
                id="exportStatsBtn"
                class="glass-button"
              >
                Stiahnuť štatistiky
              </button>
              ${
                CONFIG.postTestFormUrl
                  ? `
              <a
                href="${CONFIG.postTestFormUrl}"
                target="_blank"
                class="glass-button inline-block text-center no-underline"
              >
                Pokračovať na dotazník
              </a>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // Auto-export statistics on load
    setTimeout(() => {
      DataExporter.exportStatsToCSV(stats, this.subjectId);
    }, 500);

    // Manual export button
    document.getElementById("exportStatsBtn").addEventListener("click", () => {
      DataExporter.exportStatsToCSV(stats, this.subjectId);
    });
  }

  buildSARTStatsHTML(stats) {
    const createStatBox = (label, value, tooltip) => {
      return `
        <div class="bg-gray-800/30 rounded p-3">
          <div class="text-gray-400 text-xs mb-1 flex items-center">
            ${label}
            ${
              tooltip
                ? `<div class="tooltip-container">
              <span class="tooltip-icon">?</span>
              <div class="tooltip-content">${tooltip}</div>
            </div>`
                : ""
            }
          </div>
          <div class="text-lg font-medium">${value}</div>
        </div>
      `;
    };

    return `
      <div class="flex-1">
        <h2 class="text-xl font-light mb-4 text-center">SART Test</h2>
        <div class="grid grid-cols-2 gap-3 text-sm">
          ${createStatBox("Celková presnosť", `${stats.totalAccuracy}%`, "Percentuálna úspešnosť zo všetkých trialov.")}
          
          <div class="col-span-2 text-gray-500 text-xs mt-2 mb-1">No-Go trialy (číslica 3)</div>
          ${createStatBox("# No-Go trialov", stats.noGoTrialsCount, "Celkový počet No-Go trialov (číslica 3).")}
          ${createStatBox("# Správnych No-Go", stats.correctNoGoTrials, "Počet správnych No-Go trialov (nestlačil medzerník pri číslici 3).")}
          ${createStatBox("% Úspešných No-Go", `${stats.noGoAccuracy}%`, "Percentuálna úspešnosť pri No-Go trialoch.")}
          
          <div class="col-span-2 text-gray-500 text-xs mt-2 mb-1">Go trialy (ostatné číslice)</div>
          ${createStatBox("# Go trialov", stats.goTrialsCount, "Celkový počet Go trialov (ostatné číslice okrem 3).")}
          ${createStatBox("# Správnych Go", stats.correctGoTrialsCount, "Počet správnych Go trialov (stlačil medzerník pri správnej číslici).")}
          ${createStatBox("% Úspešných Go", `${stats.goAccuracy}%`, "Percentuálna úspešnosť pri Go trialoch.")}
          ${createStatBox("Priemerný čas (správne Go)", `${stats.meanRT_correctGo || "N/A"} ms`, "Priemerný reakčný čas pre správne Go odpovede v milisekundách.")}
          
          <div class="col-span-2 text-gray-500 text-xs mt-2 mb-1">Ďalšie štatistiky</div>
          ${createStatBox("SD RT", `${stats.sdRT || "N/A"} ms`, "Smerodajná odchýlka reakčných časov. Meria variabilitu reakčných časov.")}
          ${createStatBox("Medián RT", `${stats.medianRT || "N/A"} ms`, "Medián reakčných časov pre správne Go odpovede. Menej ovplyvnený extrémnymi hodnotami ako priemer.")}
          ${createStatBox("Max streak", stats.maxStreak, "Najväčší počet po sebe idúcich správnych odpovedí.")}
          ${createStatBox("Celkový čas", `${stats.totalTime || "N/A"} s`, "Celkový čas trvania testu v sekundách.")}
        </div>
      </div>
    `;
  }

  buildNBackStatsHTML(stats) {
    const createStatBox = (label, value, tooltip) => {
      return `
        <div class="bg-gray-800/30 rounded p-3">
          <div class="text-gray-400 text-xs mb-1 flex items-center">
            ${label}
            ${
              tooltip
                ? `<div class="tooltip-container">
              <span class="tooltip-icon">?</span>
              <div class="tooltip-content">${tooltip}</div>
            </div>`
                : ""
            }
          </div>
          <div class="text-lg font-medium">${value}</div>
        </div>
      `;
    };

    // Calculate d-prime details for tooltip
    let dPrimeTooltip = "";
    if (stats.dPrime && stats.dPrime !== "N/A (nedostatočná vzorka)") {
      const hitRateText = stats.hitRate ? `Hit Rate: ${stats.hitRate}%` : "";
      const falseAlarmRateText = stats.falseAlarmRate
        ? `False Alarm Rate: ${stats.falseAlarmRate}%`
        : "";

      dPrimeTooltip = `d-prime (d') je miera diskriminácie založená na Signal Detection Theory. ${hitRateText ? hitRateText + ". " : ""}${falseAlarmRateText ? falseAlarmRateText + ". " : ""}Hodnota ${stats.dPrime} znamená ${this.interpretDPrime(parseFloat(stats.dPrime))}.`;
    } else {
      dPrimeTooltip =
        "d-prime sa počíta len pri dostatočnej vzorke (min. 5 match a 5 non-match trialov).";
    }

    return `
      <div class="flex-1">
        <h2 class="text-xl font-light mb-4 text-center">N-back Test</h2>
        <div class="grid grid-cols-2 gap-3 text-sm">
          ${createStatBox("# Správnych odpovedí", stats.correctResponses, "Celkový počet správnych odpovedí.")}
          ${createStatBox("Percentuálna úspešnosť", `${stats.totalAccuracy}%`, "Percentuálna úspešnosť zo všetkých trialov.")}
          ${createStatBox("Response time (správne Match)", `${stats.meanRT_correctMatch || "N/A"} ms`, "Priemerný reakčný čas pri úspešných matching úlohách v milisekundách.")}
          
          <div class="col-span-2 text-gray-500 text-xs mt-2 mb-1">Match situácie</div>
          ${createStatBox("# Match situácií", stats.matchTrialsCount, "Celkový počet matching situácií (keď sa písmeno zhodovalo s písmenom pred 2 pozíciami).")}
          ${createStatBox("# Trafených Match", stats.correctMatchResponses, "Koľkokrát subjekt správne trafil match (stlačil M pri match).")}
          
          <div class="col-span-2 text-gray-500 text-xs mt-2 mb-1">Non-Match situácie</div>
          ${createStatBox("# Non-Match situácií", stats.nonMatchTrialsCount, "Celkový počet non-matching situácií (keď sa písmeno nezhodovalo).")}
          ${createStatBox("# False alarms", stats.falseAlarms, "Koľkokrát subjekt dal match na non-matching (stlačil M keď nemal).")}
          
          <div class="col-span-2 text-gray-500 text-xs mt-2 mb-1">Ďalšie štatistiky</div>
          ${createStatBox("Presnosť Match", `${stats.matchAccuracy}%`, "Percento správnych odpovedí pri Match trialoch.")}
          ${createStatBox("Presnosť Non-Match", `${stats.nonMatchAccuracy}%`, "Percento správnych odpovedí pri Non-Match trialoch.")}
          ${createStatBox("d-prime", stats.dPrime, dPrimeTooltip)}
          ${createStatBox("SD RT", `${stats.sdRT || "N/A"} ms`, "Smerodajná odchýlka reakčných časov. Meria variabilitu reakčných časov.")}
          ${createStatBox("Medián RT", `${stats.medianRT || "N/A"} ms`, "Medián reakčných časov pre správne Match odpovede. Menej ovplyvnený extrémnymi hodnotami ako priemer.")}
          ${createStatBox("Max streak", stats.maxStreak, "Najväčší počet po sebe idúcich správnych odpovedí.")}
          ${createStatBox("Celkový čas", `${stats.totalTime || "N/A"} s`, "Celkový čas trvania testu v sekundách.")}
        </div>
      </div>
    `;
  }

  interpretDPrime(dPrime) {
    if (dPrime <= 0)
      return "náhodné odpovede (neschopnosť rozlíšiť signál od šumu)";
    if (dPrime < 1) return "slabá schopnosť rozlíšenia";
    if (dPrime < 2) return "priemerná schopnosť rozlíšenia";
    if (dPrime < 3) return "dobrá schopnosť rozlíšenia";
    return "výborná schopnosť rozlíšenia";
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
});

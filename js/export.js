// CSV export functionality
class DataExporter {
  // Definované poradie SART štatistík
  static SART_STATS_ORDER = [
    "totalTrials",
    "goTrialsCount",
    "noGoTrialsCount",
    "totalAccuracy",
    "goAccuracy",
    "noGoAccuracy",
    "correctGoTrialsCount",
    "correctNoGoTrials",
    "commissionErrors",
    "omissionErrors",
    "commissionErrorsPercent",
    "omissionErrorsPercent",
    "meanRT_correctGo",
    "postErrorSlowingMean",
    "postErrorSlowingMedian",
    "postErrorSlowingCount",
    "sdRT",
    "medianRT",
    "maxStreak",
    "fastRTRate",
    "rtDriftCorrelation",
    "rtDriftHalfDiff",
    "totalTime",
    "correctResponses",
    "incorrectResponses",
    "meanRT_allGo",
  ];

  // Definované poradie N-back štatistík
  static NBACK_STATS_ORDER = [
    "totalTrials",
    "matchTrialsCount",
    "nonMatchTrialsCount",
    "totalAccuracy",
    "matchAccuracy",
    "nonMatchAccuracy",
    "correctMatchResponses",
    "correctNonMatchResponses",
    "falseAlarms",
    "misses",
    "dPrime",
    "criterionC",
    "hitRate",
    "falseAlarmRate",
    "meanRT_correctMatch",
    "sdRT",
    "medianRT",
    "maxStreak",
    "rtDifferenceHitVsFalseAlarm",
    "learningTrend",
    "totalTime",
    "correctResponses",
    "incorrectResponses",
  ];

  // Slovenské názvy pre SART štatistiky
  static SART_STATS_LABELS = {
    totalTrials: "Celkový počet trialov",
    goTrialsCount: "Počet go trialov",
    noGoTrialsCount: "Počet no go trialov",
    totalAccuracy: "Celková úspešnosť (%)",
    goAccuracy: "Úspešnosť pri go trialov (%)",
    noGoAccuracy: "Úspešnosť pri nogo trialov (%)",
    correctGoTrialsCount: "Počet správnych go trialov",
    correctNoGoTrials: "Počet správnych no go trialov",
    commissionErrors: "Commission errors",
    omissionErrors: "Omission errors",
    commissionErrorsPercent: "Commission errors (%)",
    omissionErrorsPercent: "Omission errors (%)",
    meanRT_correctGo: "Priemerný čas pri správnych go trialov (ms)",
    postErrorSlowingMean: "Post-error slowing - mean (ms)",
    postErrorSlowingMedian: "Post-error slowing - median (ms)",
    postErrorSlowingCount: "Post-error slowing - počet prípadov",
    sdRT: "Štandardná odchýlka reakčného času (ms)",
    medianRT: "Medián reakčného času (ms)",
    maxStreak: "Maxstreak",
    fastRTRate: "Fast RT rate - odpovede < 250ms (%)",
    rtDriftCorrelation: "RT drift - korelácia",
    rtDriftHalfDiff: "RT drift - rozdiel polovíc (ms)",
    totalTime: "Celkový čas trvania (s)",
    correctResponses: "Celkový počet správnych odpovedí",
    incorrectResponses: "Celkový počet nesprávnych odpovedí",
    meanRT_allGo: "Priemerný čas pri všetkých go trialov (ms)",
  };

  // Slovenské názvy pre N-back štatistiky
  static NBACK_STATS_LABELS = {
    totalTrials: "Celkový počet trialov",
    matchTrialsCount: "Počet match situácii",
    nonMatchTrialsCount: "Počet nonmatch situácii",
    totalAccuracy: "Celková úspešnosť (%)",
    matchAccuracy: "Úspešnosť pri match (%)",
    nonMatchAccuracy: "Úspešnosť pri non match (%)",
    correctMatchResponses: "Počet správnych odpovedí match",
    correctNonMatchResponses: "Počet správnych odpovedí nonmatch",
    falseAlarms: "False Alarm",
    misses: "Misses",
    dPrime: "d-Prime",
    criterionC: "Criterion C",
    hitRate: "Hit Rate (%)",
    falseAlarmRate: "False Alarm Rate (%)",
    meanRT_correctMatch: "Priemerný čas správnych odpovedí pri match (ms)",
    sdRT: "Štandardná odchýlka reakčného času (ms)",
    medianRT: "Medián reakčného času (ms)",
    maxStreak: "Najväčší streak správnych odpovedí",
    rtDifferenceHitVsFalseAlarm: "RT difference hit vs. false alarm (ms)",
    learningTrend: "Learning/trend across trials (%)",
    totalTime: "Celkový čas testu (s)",
    correctResponses: "Počet správnych odpovedí",
    incorrectResponses: "Počet nesprávnych odpovedí",
  };

  static exportToCSV(data, subjectId, stats = null) {
    if (!data || data.length === 0) {
      console.error("No data to export");
      return;
    }

    // Separate data by test type
    const sartData = data.filter((point) => point.testName === "SART");
    const nbackData = data.filter((point) => point.testName === "N-back");

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    // Export SART data
    if (sartData.length > 0) {
      this.exportTestData(sartData, "SART", subjectId, timestamp, stats?.sart);
    }

    // Export N-back data
    if (nbackData.length > 0) {
      this.exportTestData(
        nbackData,
        "N-back",
        subjectId,
        timestamp,
        stats?.nback,
      );
    }
  }

  static exportTestData(data, testName, subjectId, timestamp, testStats) {
    // Get all unique keys from all data points
    const allKeys = new Set();
    data.forEach((point) => {
      Object.keys(point).forEach((key) => allKeys.add(key));
    });

    const headers = Array.from(allKeys).sort();

    // Create CSV content with trial data
    let csvContent = headers.join(",") + "\n";

    data.forEach((point) => {
      const row = headers.map((header) => {
        const value = point[header];
        // Handle null/undefined
        if (value === null || value === undefined) {
          return "";
        }
        // Escape commas and quotes
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
      });
      csvContent += row.join(",") + "\n";
    });

    // Add statistics if provided
    if (testStats) {
      csvContent += "\n\n=== STATISTICS ===\n";
      csvContent += "Statistic,Value\n";

      const order =
        testName === "SART" ? this.SART_STATS_ORDER : this.NBACK_STATS_ORDER;
      const labels =
        testName === "SART" ? this.SART_STATS_LABELS : this.NBACK_STATS_LABELS;

      order.forEach((key) => {
        if (testStats.hasOwnProperty(key)) {
          const label = labels[key] || key;
          const value = testStats[key];
          csvContent += `${label},${value !== null && value !== undefined ? value : "N/A"}\n`;
        }
      });
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Generate simple filename
    const testNameLower = testName.toLowerCase().replace("-", "_");
    const filename = `${testNameLower}_${subjectId}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup blob URL
    URL.revokeObjectURL(url);
  }

  static exportStatsToCSV(stats, subjectId) {
    if (!stats) {
      console.error("No statistics to export");
      return;
    }

    // Export SART statistics
    if (stats.sart) {
      let csvContent = "Statistic,Value\n";

      this.SART_STATS_ORDER.forEach((key) => {
        if (stats.sart.hasOwnProperty(key)) {
          const label = this.SART_STATS_LABELS[key] || key;
          const value = stats.sart[key];
          csvContent += `${label},${value !== null && value !== undefined ? value : "N/A"}\n`;
        }
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename = `sart_${subjectId}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup blob URL
      URL.revokeObjectURL(url);
    }

    // Export N-back statistics
    if (stats.nback) {
      let csvContent = "Statistic,Value\n";

      this.NBACK_STATS_ORDER.forEach((key) => {
        if (stats.nback.hasOwnProperty(key)) {
          const label = this.NBACK_STATS_LABELS[key] || key;
          const value = stats.nback[key];
          csvContent += `${label},${value !== null && value !== undefined ? value : "N/A"}\n`;
        }
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename = `nback_${subjectId}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup blob URL
      URL.revokeObjectURL(url);
    }
  }
}

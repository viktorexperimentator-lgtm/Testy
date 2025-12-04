// Statistics calculation module
class StatisticsCalculator {
  // Helper function for z-score (inverse normal CDF approximation)
  static zScore(p) {
    if (p <= 0 || p >= 1) return 0;
    if (p === 0.5) return 0;

    const sign = p < 0.5 ? -1 : 1;
    const t = p < 0.5 ? p : 1 - p;

    // Rational approximation
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;

    const x = Math.sqrt(-2.0 * Math.log(t));
    const z =
      sign *
      (x -
        (c0 + c1 * x + c2 * x * x) /
          (1 + d1 * x + d2 * x * x + d3 * x * x * x));

    return z;
  }

  // Helper function for median calculation
  static calculateMedian(values) {
    if (!values || values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  // Helper function for Pearson correlation coefficient
  static calculateCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length < 2) return null;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    if (denominator === 0) return null;
    return numerator / denominator;
  }

  static calculateSARTStats(data) {
    if (!data || data.length === 0) return null;

    // Basic filtering
    const goTrials = data.filter((t) => t.go === 1);
    const noGoTrials = data.filter((t) => t.go === 0);
    const correctTrials = data.filter((t) => t.responseOutcome === 1);
    const incorrectTrials = data.filter((t) => t.responseOutcome === 0);

    // 1. Celkový počet trialov
    const totalTrials = data.length;

    // 2. Počet go trialov
    const goTrialsCount = goTrials.length;

    // 3. Počet no go trialov
    const noGoTrialsCount = noGoTrials.length;

    // 4. Celková úspešnosť %
    const totalAccuracy =
      totalTrials > 0 ? (correctTrials.length / totalTrials) * 100 : 0;

    // 5. Úspešnosť pri go trialov %
    const goAccuracy =
      goTrialsCount > 0
        ? (goTrials.filter((t) => t.responseOutcome === 1).length /
            goTrialsCount) *
          100
        : 0;

    // 6. Úspešnosť pri nogo trialov %
    const noGoAccuracy =
      noGoTrialsCount > 0
        ? (noGoTrials.filter((t) => t.responseOutcome === 1).length /
            noGoTrialsCount) *
          100
        : 0;

    // 7. Počet správnych go trialov
    const correctGoTrialsCount = goTrials.filter(
      (t) => t.responseOutcome === 1,
    ).length;

    // 8. Počet správnych no go trialov
    const correctNoGoTrials = noGoTrials.filter(
      (t) => t.responseOutcome === 1,
    ).length;

    // 9. Commission errors (stlačil pri no-go)
    const commissionErrors = noGoTrials.filter((t) => t.response === 1).length;

    // 10. Omission errors (nestlačil pri go)
    const omissionErrors = goTrials.filter((t) => t.response === 0).length;

    // 11. Commission errors %
    const commissionErrorsPercent =
      noGoTrialsCount > 0 ? (commissionErrors / noGoTrialsCount) * 100 : 0;

    // 12. Omission errors %
    const omissionErrorsPercent =
      goTrialsCount > 0 ? (omissionErrors / goTrialsCount) * 100 : 0;

    // Reaction time calculations for correct go trials
    const correctGoTrialsWithRT = goTrials.filter(
      (t) => t.responseOutcome === 1 && t.reactionTime !== null,
    );
    const allGoResponsesWithRT = goTrials.filter(
      (t) => t.response === 1 && t.reactionTime !== null,
    );

    // 13. Priemerný čas pri správnych go trialov
    const meanRT_correctGo =
      correctGoTrialsWithRT.length > 0
        ? correctGoTrialsWithRT.reduce((sum, t) => sum + t.reactionTime, 0) /
          correctGoTrialsWithRT.length
        : null;

    // 14. Post-error slowing
    // Nájdem trialy nasledujúce po chybe, vynechám tie kde nasledujúca je tiež chyba
    // Počítam len správne trialy
    let postErrorRTs = [];
    let postCorrectRTs = [];

    for (let i = 1; i < data.length; i++) {
      const prevTrial = data[i - 1];
      const currentTrial = data[i];

      // Ak je aktuálny trial správny a má RT
      if (
        currentTrial.responseOutcome === 1 &&
        currentTrial.reactionTime !== null &&
        currentTrial.go === 1
      ) {
        if (prevTrial.responseOutcome === 0) {
          // Predchádzajúci bol chyba
          postErrorRTs.push(currentTrial.reactionTime);
        } else {
          // Predchádzajúci bol správny
          postCorrectRTs.push(currentTrial.reactionTime);
        }
      }
    }

    const postErrorSlowingMean =
      postErrorRTs.length > 0 && postCorrectRTs.length > 0
        ? postErrorRTs.reduce((a, b) => a + b, 0) / postErrorRTs.length -
          postCorrectRTs.reduce((a, b) => a + b, 0) / postCorrectRTs.length
        : null;

    const postErrorSlowingMedian =
      postErrorRTs.length > 0 && postCorrectRTs.length > 0
        ? this.calculateMedian(postErrorRTs) -
          this.calculateMedian(postCorrectRTs)
        : null;

    const postErrorSlowingCount = postErrorRTs.length;

    // 15. Štandardná odchýlka reakčného času
    const sdRT =
      correctGoTrialsWithRT.length > 1
        ? Math.sqrt(
            correctGoTrialsWithRT.reduce(
              (sum, t) => sum + Math.pow(t.reactionTime - meanRT_correctGo, 2),
              0,
            ) /
              (correctGoTrialsWithRT.length - 1),
          )
        : null;

    // 16. Medián reakčného času
    const medianRT = this.calculateMedian(
      correctGoTrialsWithRT.map((t) => t.reactionTime),
    );

    // 17. Maxstreak
    let currentStreak = 0;
    let maxStreak = 0;
    for (const trial of data) {
      if (trial.responseOutcome === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // 18. Fast RT rate (percento odpovedí < 250 ms)
    const fastRTCount = allGoResponsesWithRT.filter(
      (t) => t.reactionTime < 250,
    ).length;
    const fastRTRate =
      allGoResponsesWithRT.length > 0
        ? (fastRTCount / allGoResponsesWithRT.length) * 100
        : 0;

    // 19. RT drift (zmena RT v priebehu času)
    // a) Korelačný koeficient medzi trial number a RT
    const trialsWithRT = data.filter(
      (t) => t.response === 1 && t.reactionTime !== null,
    );
    const trialNumbers = trialsWithRT.map((t) => t.trialNumber);
    const reactionTimes = trialsWithRT.map((t) => t.reactionTime);
    const rtDriftCorrelation = this.calculateCorrelation(
      trialNumbers,
      reactionTimes,
    );

    // b) Rozdiel medzi priemerným RT v prvej polovici vs druhej polovici
    const halfIndex = Math.floor(trialsWithRT.length / 2);
    const firstHalfRTs = reactionTimes.slice(0, halfIndex);
    const secondHalfRTs = reactionTimes.slice(halfIndex);

    const firstHalfMean =
      firstHalfRTs.length > 0
        ? firstHalfRTs.reduce((a, b) => a + b, 0) / firstHalfRTs.length
        : null;
    const secondHalfMean =
      secondHalfRTs.length > 0
        ? secondHalfRTs.reduce((a, b) => a + b, 0) / secondHalfRTs.length
        : null;
    const rtDriftHalfDiff =
      firstHalfMean !== null && secondHalfMean !== null
        ? secondHalfMean - firstHalfMean
        : null;

    // 20. Celkový čas trvania
    const startTime = data[0]?.timestamp || null;
    const endTime = data[data.length - 1]?.timestamp || null;
    const totalTime =
      startTime && endTime ? (endTime - startTime) / 1000 : null;

    // 21. Celkový počet správnych odpovedí
    const correctResponses = correctTrials.length;

    // 22. Celkový počet nesprávnych odpovedí
    const incorrectResponses = incorrectTrials.length;

    // 23. Priemerný čas pri všetkých go trialov
    const meanRT_allGo =
      allGoResponsesWithRT.length > 0
        ? allGoResponsesWithRT.reduce((sum, t) => sum + t.reactionTime, 0) /
          allGoResponsesWithRT.length
        : null;

    // Return in the exact requested order
    return {
      totalTrials,
      goTrialsCount,
      noGoTrialsCount,
      totalAccuracy: totalAccuracy.toFixed(2),
      goAccuracy: goAccuracy.toFixed(2),
      noGoAccuracy: noGoAccuracy.toFixed(2),
      correctGoTrialsCount,
      correctNoGoTrials,
      commissionErrors,
      omissionErrors,
      commissionErrorsPercent: commissionErrorsPercent.toFixed(2),
      omissionErrorsPercent: omissionErrorsPercent.toFixed(2),
      meanRT_correctGo: meanRT_correctGo ? meanRT_correctGo.toFixed(2) : null,
      postErrorSlowingMean: postErrorSlowingMean
        ? postErrorSlowingMean.toFixed(2)
        : null,
      postErrorSlowingMedian: postErrorSlowingMedian
        ? postErrorSlowingMedian.toFixed(2)
        : null,
      postErrorSlowingCount,
      sdRT: sdRT ? sdRT.toFixed(2) : null,
      medianRT: medianRT ? medianRT.toFixed(2) : null,
      maxStreak,
      fastRTRate: fastRTRate.toFixed(2),
      rtDriftCorrelation: rtDriftCorrelation
        ? rtDriftCorrelation.toFixed(4)
        : null,
      rtDriftHalfDiff: rtDriftHalfDiff ? rtDriftHalfDiff.toFixed(2) : null,
      totalTime: totalTime ? totalTime.toFixed(2) : null,
      correctResponses,
      incorrectResponses,
      meanRT_allGo: meanRT_allGo ? meanRT_allGo.toFixed(2) : null,
    };
  }

  static calculateNBackStats(data) {
    if (!data || data.length === 0) return null;

    // Basic filtering
    const matchTrials = data.filter((t) => t.isMatch === 1);
    const nonMatchTrials = data.filter((t) => t.isMatch === 0);
    const correctTrials = data.filter((t) => t.responseOutcome === 1);
    const incorrectTrials = data.filter((t) => t.responseOutcome === 0);

    // 1. totalTrials
    const totalTrials = data.length;

    // 2. Počet match situácii
    const matchTrialsCount = matchTrials.length;

    // 3. Počet nonmatch situácii
    const nonMatchTrialsCount = nonMatchTrials.length;

    // 4. Celková úspešnosť %
    const totalAccuracy =
      totalTrials > 0 ? (correctTrials.length / totalTrials) * 100 : 0;

    // 5. Úspešnosť pri match %
    const matchAccuracy =
      matchTrialsCount > 0
        ? (matchTrials.filter((t) => t.responseOutcome === 1).length /
            matchTrialsCount) *
          100
        : 0;

    // 6. Úspešnosť pri non match %
    const nonMatchAccuracy =
      nonMatchTrialsCount > 0
        ? (nonMatchTrials.filter((t) => t.responseOutcome === 1).length /
            nonMatchTrialsCount) *
          100
        : 0;

    // 7. Počet správnych odpovedí match (hits)
    const correctMatchResponses = matchTrials.filter(
      (t) => t.response === 1 && t.responseOutcome === 1,
    ).length;

    // 8. Počet správnych odpovedí nonmatch (correct rejections)
    const correctNonMatchResponses = nonMatchTrials.filter(
      (t) => t.response === 0 && t.responseOutcome === 1,
    ).length;

    // 9. falseAlarm (stlačil M pri non-match)
    const falseAlarms = nonMatchTrials.filter((t) => t.response === 1).length;

    // 10. misses (nestlačil M pri match)
    const misses = matchTrials.filter((t) => t.response === 0).length;

    // Signal Detection Theory calculations
    let hitRate = null;
    let falseAlarmRate = null;
    let dPrime = null;
    let criterionC = null;

    if (matchTrialsCount >= 5 && nonMatchTrialsCount >= 5) {
      hitRate =
        matchTrials.filter((t) => t.response === 1).length / matchTrialsCount;
      falseAlarmRate = falseAlarms / nonMatchTrialsCount;

      // Adjust for perfect scores (0 or 1)
      const adjustedHitRate =
        hitRate === 1 ? 0.99 : hitRate === 0 ? 0.01 : hitRate;
      const adjustedFalseAlarmRate =
        falseAlarmRate === 0
          ? 0.01
          : falseAlarmRate === 1
            ? 0.99
            : falseAlarmRate;

      const zHit = this.zScore(adjustedHitRate);
      const zFA = this.zScore(adjustedFalseAlarmRate);

      // 11. dPrime
      dPrime = zHit - zFA;

      // 12. Criterion C
      criterionC = -0.5 * (zHit + zFA);
    }

    // Reaction time calculations
    // Hits - správne match odpovede (stlačil M pri match)
    const hitsWithRT = matchTrials.filter(
      (t) =>
        t.response === 1 && t.responseOutcome === 1 && t.reactionTime !== null,
    );
    // Correct rejections - správne non-match (nestlačil pri non-match) - tieto nemajú RT
    // False alarms - nesprávne stlačil pri non-match
    const falseAlarmsWithRT = nonMatchTrials.filter(
      (t) => t.response === 1 && t.reactionTime !== null,
    );

    // 15. Priemerný čas správnych odpovedí pri match situáciach
    const meanRT_correctMatch =
      hitsWithRT.length > 0
        ? hitsWithRT.reduce((sum, t) => sum + t.reactionTime, 0) /
          hitsWithRT.length
        : null;

    // 16. Štandardná odchýlka reakčného času (pre hits)
    const sdRT =
      hitsWithRT.length > 1
        ? Math.sqrt(
            hitsWithRT.reduce(
              (sum, t) =>
                sum + Math.pow(t.reactionTime - meanRT_correctMatch, 2),
              0,
            ) /
              (hitsWithRT.length - 1),
          )
        : null;

    // 17. Medián reakčného času
    const medianRT = this.calculateMedian(
      hitsWithRT.map((t) => t.reactionTime),
    );

    // 18. Najväčší streak správnych odpovedí
    let currentStreak = 0;
    let maxStreak = 0;
    for (const trial of data) {
      if (trial.responseOutcome === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // 19. RT difference hit vs. correct rejection
    // Correct rejections nemajú RT (nestlačili), tak porovnáme hits vs false alarms
    // Alebo môžeme použiť len hits RT ako základ
    const meanRT_hits =
      hitsWithRT.length > 0
        ? hitsWithRT.reduce((sum, t) => sum + t.reactionTime, 0) /
          hitsWithRT.length
        : null;
    const meanRT_falseAlarms =
      falseAlarmsWithRT.length > 0
        ? falseAlarmsWithRT.reduce((sum, t) => sum + t.reactionTime, 0) /
          falseAlarmsWithRT.length
        : null;

    const rtDifferenceHitVsFalseAlarm =
      meanRT_hits !== null && meanRT_falseAlarms !== null
        ? meanRT_hits - meanRT_falseAlarms
        : null;

    // 20. Learning/trend across trials (prvých 26 vs druhých 26)
    // Berieme accuracy pre prvých 26 a druhých 26 trialov
    const firstBlockTrials = data.slice(0, 26);
    const secondBlockTrials = data.slice(26, 52);

    const firstBlockAccuracy =
      firstBlockTrials.length > 0
        ? (firstBlockTrials.filter((t) => t.responseOutcome === 1).length /
            firstBlockTrials.length) *
          100
        : null;
    const secondBlockAccuracy =
      secondBlockTrials.length > 0
        ? (secondBlockTrials.filter((t) => t.responseOutcome === 1).length /
            secondBlockTrials.length) *
          100
        : null;

    const learningTrend =
      firstBlockAccuracy !== null && secondBlockAccuracy !== null
        ? secondBlockAccuracy - firstBlockAccuracy
        : null;

    // 21. Celkový čas testu
    const startTime = data[0]?.timestamp || null;
    const endTime = data[data.length - 1]?.timestamp || null;
    const totalTime =
      startTime && endTime ? (endTime - startTime) / 1000 : null;

    // 22. Počet správnych odpovedí
    const correctResponses = correctTrials.length;

    // 23. Počet nesprávnych odpovedí
    const incorrectResponses = incorrectTrials.length;

    // Return in the exact requested order
    return {
      totalTrials,
      matchTrialsCount,
      nonMatchTrialsCount,
      totalAccuracy: totalAccuracy.toFixed(2),
      matchAccuracy: matchAccuracy.toFixed(2),
      nonMatchAccuracy: nonMatchAccuracy.toFixed(2),
      correctMatchResponses,
      correctNonMatchResponses,
      falseAlarms,
      misses,
      dPrime: dPrime !== null ? dPrime.toFixed(2) : "N/A",
      criterionC: criterionC !== null ? criterionC.toFixed(2) : "N/A",
      hitRate: hitRate !== null ? (hitRate * 100).toFixed(2) : null,
      falseAlarmRate:
        falseAlarmRate !== null ? (falseAlarmRate * 100).toFixed(2) : null,
      meanRT_correctMatch: meanRT_correctMatch
        ? meanRT_correctMatch.toFixed(2)
        : null,
      sdRT: sdRT ? sdRT.toFixed(2) : null,
      medianRT: medianRT ? medianRT.toFixed(2) : null,
      maxStreak,
      rtDifferenceHitVsFalseAlarm: rtDifferenceHitVsFalseAlarm
        ? rtDifferenceHitVsFalseAlarm.toFixed(2)
        : null,
      learningTrend: learningTrend ? learningTrend.toFixed(2) : null,
      totalTime: totalTime ? totalTime.toFixed(2) : null,
      correctResponses,
      incorrectResponses,
    };
  }

  static calculateStats(data) {
    if (!data || data.length === 0) return null;

    // Filter only real blocks (not trial blocks)
    const realData = data.filter((t) => t.blockType === "real");

    // Group by test name
    const sartData = realData.filter((t) => t.testName === "SART");
    const nbackData = realData.filter((t) => t.testName === "N-back");

    const stats = {};

    if (sartData.length > 0) {
      stats.sart = this.calculateSARTStats(sartData);
    }

    if (nbackData.length > 0) {
      stats.nback = this.calculateNBackStats(nbackData);
    }

    return stats;
  }
}

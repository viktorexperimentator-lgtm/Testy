// N-back test (3-back) implementation
class NBack {
  constructor(subjectId, onComplete) {
    this.subjectId = subjectId;
    this.onComplete = onComplete;
    this.data = [];
    this.currentBlock = null;
    this.currentTrial = 0;
    this.trials = [];
    this.responseStartTime = null;
    this.waitingForResponse = false;
    this.letters = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "H",
      "I",
      "K",
      "L",
      "M",
      "O",
      "P",
      "R",
      "S",
      "T",
    ];
    this.n = 3; // 3-back task
    this.letterHistory = []; // Track last n letters
  }

  async start() {
    await this.showInstructions();
    await this.runTrialBlock();
    await this.showRealBlocksIntro();
    await this.runRealBlock(1);
    await this.runRealBlock(2);
    this.onComplete(this.data);
  }

  showRealBlocksIntro() {
    return new Promise((resolve) => {
      const container = document.getElementById("app");
      container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-black text-white px-6">
          <div class="max-w-2xl text-center">
            <div class="glass-container rounded-lg p-8 space-y-6">
              <h2 class="text-2xl font-light">Skúšobná verzia dokončená</h2>
              <p class="text-lg leading-relaxed">
                Teraz budú nasledovať <strong>2 skutočné testy</strong>.
              </p>
              <p class="text-lg leading-relaxed">
                Pravidlá ostávajú rovnaké.
              </p>
              <p> 
                Dôležitá je <strong>rýchlosť</strong> aj <strong>presnosť</strong> vašich odpovedí.
              </p>
              <p class="text-lg leading-relaxed text-gray-400">
                Pre pokračovanie stlačte <span class="bg-gray-800/50 px-3 py-1 rounded backdrop-blur-sm">MEDZERNÍK</span>
              </p>
            </div>
          </div>
        </div>
      `;

      const handleKeyDown = (e) => {
        if (e.code === "Space") {
          e.preventDefault();
          document.removeEventListener("keydown", handleKeyDown);
          resolve();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
    });
  }

  showInstructions() {
    return new Promise((resolve) => {
      const container = document.getElementById("app");
      container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-black text-white px-6">
          <div class="max-w-2xl">
            <h1 class="text-3xl font-light mb-8 text-center">N-back Test</h1>
            <div class="glass-container rounded-lg p-8 space-y-4">
              <p class="text-lg leading-relaxed">
                Uvidíte sériu písmen, ktoré sa budú zobrazovať jeden po druhom.
              </p>
              <p class="text-lg leading-relaxed">
                <strong>Vaša úloha:</strong> Stlačte <span class="bg-gray-800/50 px-2 py-1 rounded backdrop-blur-sm">M</span> 
                keď sa aktuálne písmeno <strong>zhoduje s písmenom, ktoré ste videli pred 3 pozíciami</strong>.
              </p>
              <p class="text-lg leading-relaxed">
                Ak sa písmená nezhodujú, <strong>NESTLÁČAJTE</strong> nič.
              </p>
              <p class="text-lg leading-relaxed text-yellow-400 mt-4">
                Dôležitá je <strong>rýchlosť</strong> aj <strong>presnosť</strong> vašich odpovedí.
              </p>
              <p class="text-lg leading-relaxed text-gray-400 mt-6">
                <strong>Príklad:</strong> Ak vidíte sekvenciu A, B, C, A - stlačte M pri druhom A, 
                pretože A sa zhoduje s A pred 3 pozíciami.
              </p>
              <div class="mt-8 text-center">
                <button
                  id="startBtn"
                  class="glass-button"
                >
                  Začať test
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById("startBtn").addEventListener("click", resolve);
    });
  }

  generateTrials(count, blockType) {
    const trials = [];
    const matchCount = CONFIG.nback.matchCount;

    // Generate sequence ensuring we have exactly the required number of matches
    // We'll store ALL letters and compute nback references at the end
    const allLetters = [];
    let matchesGenerated = 0;
    const remainingTrials = count - this.n; // Trials that can potentially be matches
    const targetMatches = Math.min(matchCount, remainingTrials); // Exact number of matches we need

    // Generate all letters first
    for (let i = 0; i < count; i++) {
      let letter;
      let isMatch = false;

      if (i < this.n) {
        // First n letters can't be matches
        letter = this.letters[Math.floor(Math.random() * this.letters.length)];
      } else {
        const remainingPossibleMatches = count - i;
        const matchesStillNeeded = targetMatches - matchesGenerated;

        const needsMoreMatches = matchesGenerated < targetMatches;
        const isLastChance = remainingPossibleMatches <= matchesStillNeeded;

        const shouldTryMatch =
          needsMoreMatches &&
          (isLastChance || (matchesStillNeeded > 0 && Math.random() < 0.4));

        if (shouldTryMatch) {
          // Create a match: use the letter from n positions ago
          letter = allLetters[i - this.n];
          isMatch = true;
          matchesGenerated++;
        } else {
          // Create a non-match: use a different letter
          const previousNLetter = allLetters[i - this.n];
          const availableLetters = this.letters.filter(
            (l) => l !== previousNLetter,
          );
          letter =
            availableLetters[Math.floor(Math.random() * availableLetters.length)];
        }
      }

      allLetters.push(letter);
    }

    // Now create trial objects with correct nback references
    for (let i = 0; i < count; i++) {
      const letter = allLetters[i];
      const nback1 = i >= 1 ? allLetters[i - 1] : null;
      const nback2 = i >= 2 ? allLetters[i - 2] : null;
      const nback3 = i >= 3 ? allLetters[i - 3] : null;
      const isMatch = i >= this.n && letter === allLetters[i - this.n];

      trials.push({
        letter: letter,
        isMatch: isMatch,
        trialNumber: i + 1,
        nback1: nback1,
        nback2: nback2,
        nback3: nback3,
      });
    }

    // Verify we got the right number of matches
    const actualMatches = trials.filter((t) => t.isMatch).length;
    console.log(
      `[N-back] Generated ${actualMatches} matches (target: ${targetMatches})`,
    );

    return trials;
  }

  async runTrialBlock() {
    this.currentBlock = "trial";
    this.currentTrial = 0;
    this.letterHistory = [];
    this.trials = this.generateTrials(CONFIG.nback.trialTrials, "trial");
    await this.showCountdown("Skúšobná verzia");
    await this.runBlock();
  }

  async runRealBlock(blockNumber) {
    this.currentBlock = "real";
    this.currentTrial = 0;
    this.letterHistory = [];
    this.trials = this.generateTrials(CONFIG.nback.realTrials, "real");
    await this.showCountdown(`Skutočná verzia ${blockNumber}`);
    await this.runBlock(blockNumber);
  }

  showCountdown(title) {
    return new Promise((resolve) => {
      let count = 3;
      const container = document.getElementById("app");

      const updateCountdown = () => {
        container.innerHTML = `
          <div class="min-h-screen flex items-center justify-center bg-black text-white">
            <div class="text-center">
              <h2 class="text-2xl font-light mb-8 text-gray-400">${title}</h2>
              <div class="text-8xl font-light">${count > 0 ? count : "Začíname"}</div>
            </div>
          </div>
        `;

        if (count > 0) {
          count--;
          setTimeout(updateCountdown, 1000);
        } else {
          setTimeout(resolve, 500);
        }
      };

      updateCountdown();
    });
  }

  async runBlock(blockNumber = null) {
    // Show trial indicator if in trial block
    const showTrialIndicator = this.currentBlock === "trial";

    for (let i = 0; i < this.trials.length; i++) {
      this.currentTrial = i;
      const trial = this.trials[i];
      await this.runTrial(trial, blockNumber, showTrialIndicator);
    }
  }

  runTrial(trial, blockNumber, showTrialIndicator) {
    return new Promise((resolve) => {
      const container = document.getElementById("app");
      let successOccurred = false;
      let errorOccurred = false;

      // Trial indicator (not used in real block, but keeping for consistency)
      const indicator = showTrialIndicator
        ? '<div class="trial-indicator">Trial</div>'
        : "";

      // Show letter (randomly lower/uppercase for display only)
      const displayLetter = Math.random() < 0.5 ? trial.letter.toLowerCase() : trial.letter;
      container.innerHTML = `
        ${indicator}
        <div class="min-h-screen flex items-center justify-center bg-black text-white">
          <div class="text-center">
            <div style="font-size: 120pt; font-weight: 300; letter-spacing: 0.1em;">
              ${displayLetter}
            </div>
          </div>
        </div>
      `;

      const trialStartTime = Date.now();
      this.waitingForResponse = true;
      this.responseStartTime = trialStartTime;

      // Handle keyboard response (only 'm' key) - use keydown and keyup to prevent holding
      let keyPressed = false;
      let responseRecorded = false;

      const handleKeyDown = (e) => {
        if (
          (e.key === "m" || e.key === "M") &&
          this.waitingForResponse &&
          !keyPressed &&
          !responseRecorded
        ) {
          e.preventDefault();
          keyPressed = true;
          responseRecorded = true;
          // Apply input lag compensation (subtract from RT to account for keyboard delay)
          const inputLag = CONFIG.inputLag || 0;
          const reactionTime = Math.max(0, Date.now() - this.responseStartTime - inputLag);
          this.waitingForResponse = false;

          // Determine if response is correct
          const isCorrect = trial.isMatch;

          // Console log for debugging
          console.log(
            `[N-back] Trial ${trial.trialNumber}: Letter = ${trial.letter}, M pressed = true, isMatch = ${trial.isMatch}, nback3 = ${trial.nback3}, isCorrect = ${isCorrect}`,
          );

          // Show appropriate effect
          if (isCorrect) {
            successOccurred = true;
            this.showSuccessEffect(container);
            console.log(`[N-back] SUCCESS: Correctly pressed M on match!`);
          } else {
            errorOccurred = true;
            this.showErrorEffect(container);
            console.log(
              `[N-back] ERROR: Pressed M but this is NOT a match! Current: ${trial.letter}, 3-back: ${trial.nback3}`,
            );
          }

          this.recordResponse(trial, blockNumber, true, reactionTime);
          // Remove listeners immediately after response
          document.removeEventListener("keydown", handleKeyDown);
          document.removeEventListener("keyup", handleKeyUp);
          // Response recorded, will resolve after blank screen timeout
        }
      };

      const handleKeyUp = (e) => {
        if (e.key === "m" || e.key === "M") {
          keyPressed = false;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);

      // Show letter for configured time
      const letterDisplayTime = CONFIG.nback.letterDisplayTime || 500;
      setTimeout(() => {
        // Stop accepting responses after letter disappears (blank screen period)
        
        // Remove event listeners - no more responses accepted during blank screen
       

        // Show blank screen (pause) - include success/error flash if occurred
        const successFlash = successOccurred
          ? '<div class="success-flash"></div>'
          : "";
        const errorFlash = errorOccurred
          ? '<div class="error-flash"></div>'
          : "";
        container.innerHTML = `
          ${indicator}
          ${successFlash}
          ${errorFlash}
          <div class="min-h-screen flex items-center justify-center bg-black text-white">
          </div>
        `;

        // Remove flash after animation
        if (successOccurred || errorOccurred) {
          setTimeout(() => {
            const flash = container.querySelector(
              ".success-flash, .error-flash",
            );
            if (flash) {
              flash.remove();
            }
          }, 300);
        }

        // Blank screen for configured time
        const blankScreenTime = CONFIG.nback.blankScreenTime || 2500;
        setTimeout(() => {
          // If no response was recorded during letter display, record it now
          this.waitingForResponse = false;
          document.removeEventListener("keydown", handleKeyDown);
          document.removeEventListener("keyup", handleKeyUp);
          if (!responseRecorded) {
            const isCorrect = !trial.isMatch; // Correct if no response on non-match
            console.log(
              `[N-back] Trial ${trial.trialNumber}: Letter = ${trial.letter}, M pressed = false, isMatch = ${trial.isMatch}, nback3 = ${trial.nback3}, isCorrect = ${isCorrect}`,
            );
            if (trial.isMatch) {
              errorOccurred = true;
              this.showErrorEffect(container);
              console.log(
                `[N-back] ERROR: Did NOT press M but this WAS a match! Current: ${trial.letter}, 3-back: ${trial.nback3}`,
              );
            }
            this.recordResponse(trial, blockNumber, false, null);
          }
          resolve();
        }, blankScreenTime);
      }, letterDisplayTime );
    });
  }

  showSuccessEffect(container) {
    // Create and show success flash effect
    const successFlash = document.createElement("div");
    successFlash.className = "success-flash";
    container.appendChild(successFlash);

    // Remove after animation
    setTimeout(() => {
      if (successFlash.parentNode) {
        successFlash.parentNode.removeChild(successFlash);
      }
    }, 300);
  }

  showErrorEffect(container) {
    // Create and show error flash effect
    const errorFlash = document.createElement("div");
    errorFlash.className = "error-flash";
    container.appendChild(errorFlash);

    // Remove after animation
    setTimeout(() => {
      if (errorFlash.parentNode) {
        errorFlash.parentNode.removeChild(errorFlash);
      }
    }, 300);
  }

  recordResponse(trial, blockNumber, responded, reactionTime) {
    // Determine if response was correct
    const isCorrect = trial.isMatch ? responded : !responded;

    // Convert letter to number (1-15) for data
    const letterToNumber = (letter) => {
      if (!letter) return null;
      return this.letters.indexOf(letter) + 1;
    };

    const dataPoint = {
      subjectId: this.subjectId,
      testName: "N-back",
      blockType: this.currentBlock,
      blockNumber: blockNumber || (this.currentBlock === "trial" ? 0 : null),
      trialNumber: trial.trialNumber,
      currentLetter: letterToNumber(trial.letter),
      nback1: letterToNumber(trial.nback1),
      nback2: letterToNumber(trial.nback2),
      nback3: letterToNumber(trial.nback3),
      isMatch: trial.isMatch ? 1 : 0,
      response: responded ? 1 : 0,
      responseOutcome: isCorrect ? 1 : 0,
      reactionTime: reactionTime || null,
      timestamp: Date.now(),
    };

    this.data.push(dataPoint);
  }
}

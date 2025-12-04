// SART (Sustained Attention to Response Task) implementation
class SART {
  constructor(subjectId, onComplete) {
    this.subjectId = subjectId;
    this.onComplete = onComplete;
    this.data = [];
    this.currentBlock = null;
    this.currentTrial = 0;
    this.trials = [];
    this.responseStartTime = null;
    this.waitingForResponse = false;
    this.fontSizes = [48, 72, 94, 100, 120]; // 5 different font sizes
    this.digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    this.noGoDigit = 3;
  }

  async start() {
    await this.showInstructions();
    await this.runTrialBlock();
    await this.showRealBlocksIntro();
    await this.runRealBlock(1);
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
                Teraz bude nasledovať <strong>skutočný test</strong>.
              </p>
              <p class="text-lg leading-relaxed">
                Pravidlá ostávajú rovnaké.
              </p>
              <p> 
                Dôležitá je <strong>rýchlosť</strong> aj <strong>presnosť</strong> vašich odpovedí.
              </p>
              <p class="text-lg leading-relaxed text-gray-400">
                Pre pokračovanie stlačte <span class="bg-gray-800/50 px-3 py-1 rounded backdrop-blur-sm">M</span>
              </p>
            </div>
          </div>
        </div>
      `;

      const handleKeyDown = (e) => {
        if (e.code === "KeyM") {
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
            <h1 class="text-3xl font-light mb-8 text-center">SART Test</h1>
            <div class="glass-container rounded-lg p-8 space-y-4">
              <p class="text-lg leading-relaxed">
                Uvidíte číslice od 1 do 9. Každá číslica sa zobrazí na krátky čas a potom bude zakrytá maskou.
              </p>
              <p class="text-lg leading-relaxed">
                <strong>Vaša úloha:</strong> Stlačte <span class="bg-gray-800/50 px-2 py-1 rounded backdrop-blur-sm">MEDZERNÍK</span> 
                pre každú číslicu, <strong>OKREM číslice 3</strong>.
              </p>
              <p class="text-lg leading-relaxed">
                Pre číslicu 3 <strong>NESTLÁČAJTE</strong> medzerník.
              </p>
              <p class="text-lg leading-relaxed text-yellow-400 mt-4">
                Dôležitá je <strong>rýchlosť</strong> aj <strong>presnosť</strong> vašich odpovedí.
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
    let digitArray = [];

    if (blockType === "trial") {
      // Trial block: each digit appears 2x (or as many as possible with small counts)
      const digitsPerCount = Math.floor(count / this.digits.length);
      const remainder = count % this.digits.length;

      this.digits.forEach((digit, index) => {
        const times = digitsPerCount + (index < remainder ? 1 : 0);
        for (let i = 0; i < times; i++) {
          digitArray.push(digit);
        }
      });
    } else {
      // Real block: use noGoCount for digit 3, distribute rest evenly
      const noGoCount = CONFIG.sart.noGoCount || 1;
      const goCount = count - noGoCount;
      const goDigits = this.digits.filter((d) => d !== this.noGoDigit);
      const digitsPerCount = Math.floor(goCount / goDigits.length);
      const remainder = goCount % goDigits.length;

      // Add no-go digits (3)
      for (let i = 0; i < noGoCount; i++) {
        digitArray.push(this.noGoDigit);
      }

      // Add go digits
      goDigits.forEach((digit, index) => {
        const times = digitsPerCount + (index < remainder ? 1 : 0);
        for (let i = 0; i < times; i++) {
          digitArray.push(digit);
        }
      });
    }

    // Shuffle and ensure no consecutive repeats
    let shuffled = [];
    let lastDigit = null;
    let attempts = 0;
    const maxAttempts = 1000;

    while (shuffled.length < digitArray.length && attempts < maxAttempts) {
      const remaining = [...digitArray];
      shuffled = [];
      lastDigit = null;

      while (remaining.length > 0) {
        const available = remaining.filter((d) => d !== lastDigit);
        if (available.length === 0) {
          // If no options, use any digit
          const randomIndex = Math.floor(Math.random() * remaining.length);
          const digit = remaining.splice(randomIndex, 1)[0];
          shuffled.push(digit);
          lastDigit = digit;
        } else {
          const randomIndex = Math.floor(Math.random() * available.length);
          const digit = available[randomIndex];
          const index = remaining.indexOf(digit);
          remaining.splice(index, 1);
          shuffled.push(digit);
          lastDigit = digit;
        }
      }

      if (shuffled.length === digitArray.length) {
        break;
      }
      attempts++;
    }

    // Create trial objects with random font sizes
    shuffled.forEach((digit, index) => {
      const fontSizeIndex = Math.floor(Math.random() * this.fontSizes.length);
      trials.push({
        digit: digit,
        fontSize: this.fontSizes[fontSizeIndex],
        fontSizeIndex: fontSizeIndex + 1, // 1-5 for data
        isGo: digit !== this.noGoDigit,
        trialNumber: index + 1,
      });
    });

    return trials;
  }

  async runTrialBlock() {
    this.currentBlock = "trial";
    this.currentTrial = 0;
    this.trials = this.generateTrials(CONFIG.sart.trialTrials, "trial");
    await this.showCountdown("Skúšobná verzia");
    await this.runBlock();
  }

  async runRealBlock(blockNumber) {
    this.currentBlock = "real";
    this.currentTrial = 0;
    this.trials = this.generateTrials(CONFIG.sart.realTrials, "real");
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
      let errorOccurred = false;
      let errorMessage = "";

      // Trial indicator
      const indicator = showTrialIndicator
        ? '<div class="trial-indicator">Trial</div>'
        : "";

      // Show digit
      container.innerHTML = `
        ${indicator}
        <div class="min-h-screen flex items-center justify-center bg-black text-white">
          <div class="text-center">
            <div style="font-size: ${trial.fontSize}pt; font-weight: 300;">
              ${trial.digit}
            </div>
          </div>
        </div>
      `;

      const trialStartTime = Date.now();
      this.waitingForResponse = true;
      this.responseStartTime = trialStartTime;

      // Handle keyboard response - use keydown and keyup to prevent holding
      let keyPressed = false;
      let responseRecorded = false;

      const handleKeyDown = (e) => {
        if (
          e.code === "Space" &&
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

          // Debug: Check if digit is 3
          const isNoGo = trial.digit === this.noGoDigit;

          // Console log for debugging
          console.log(
            `[SART] Trial ${trial.trialNumber}: Digit = ${trial.digit}, Spacebar pressed = true, isGo = ${trial.isGo}, digit === 3 = ${isNoGo}, isCorrect = ${trial.isGo}`,
          );

          // Show error effect if wrong response (pressed space on digit 3)
          if (isNoGo) {
            errorOccurred = true;
            errorMessage = "Nestláčaj medzerník keď sa zobrazuje 3!";
            this.showErrorEffect(container, errorMessage);
            console.log(`[SART] ERROR: Pressed spacebar on digit 3 (no-go)!`);
          }

          this.recordResponse(trial, blockNumber, true, reactionTime);
        }
      };

      const handleKeyUp = (e) => {
        if (e.code === "Space") {
          keyPressed = false;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);

      // Show digit for configured time
      const digitDisplayTime = CONFIG.sart.digitDisplayTime || 250;
      setTimeout(() => {
        // Show mask (circle with cross) - include error flash if error occurred
        const errorFlash = errorOccurred
          ? '<div class="error-flash"></div>'
          : "";
        const errorText = errorOccurred
          ? `<div class="error-text" style="color: #ef4444; font-size: 18px; margin-top: 20px; font-weight: 500;">${errorMessage}</div>`
          : "";
        container.innerHTML = `
          ${indicator}
          ${errorFlash}
          <div class="min-h-screen flex items-center justify-center bg-black text-white">
            <div class="text-center">
              <svg width="120" height="120" viewBox="0 0 120 120" class="mx-auto">
                <circle cx="60" cy="60" r="50" stroke="white" stroke-width="2" fill="none"/>
                <line x1="60" y1="10" x2="60" y2="110" stroke="white" stroke-width="2"/>
                <line x1="10" y1="60" x2="110" y2="60" stroke="white" stroke-width="2"/>
              </svg>
              ${errorText}
            </div>
          </div>
        `;

        // Remove error flash after animation
        if (errorOccurred) {
          setTimeout(() => {
            const flash = container.querySelector(".error-flash");
            if (flash) {
              flash.remove();
            }
          }, 300);
        }

        // Mask shown for configured time - response still accepted during mask
        const maskTime = CONFIG.sart.maskTime || 900;
        setTimeout(() => {
          // Stop accepting responses after mask period ends
          this.waitingForResponse = false;
          // Remove event listeners
          document.removeEventListener("keydown", handleKeyDown);
          document.removeEventListener("keyup", handleKeyUp);

          // If no response was recorded during digit display or mask, record it now
          if (!responseRecorded) {
            const isNoGo = trial.digit === this.noGoDigit;
            const isCorrect = isNoGo; // Correct if no response on no-go
            console.log(
              `[SART] Trial ${trial.trialNumber}: Digit = ${trial.digit}, Spacebar pressed = false, isGo = ${trial.isGo}, digit === 3 = ${isNoGo}, isCorrect = ${isCorrect}`,
            );
            this.recordResponse(trial, blockNumber, false, null);
          }
          resolve();
        }, maskTime);
      }, digitDisplayTime);
    });
  }

  showErrorEffect(container, message = "") {
    // Create and show error flash effect
    const errorFlash = document.createElement("div");
    errorFlash.className = "error-flash";
    container.appendChild(errorFlash);

    // Show error message if provided
    if (message) {
      const errorText = document.createElement("div");
      errorText.className = "error-text";
      errorText.style.cssText =
        "color: #ef4444; font-size: 18px; margin-top: 20px; font-weight: 500; position: fixed; top: 60%; left: 50%; transform: translateX(-50%); z-index: 1000;";
      errorText.textContent = message;
      container.appendChild(errorText);

      // Remove error text after animation
      setTimeout(() => {
        if (errorText.parentNode) {
          errorText.parentNode.removeChild(errorText);
        }
      }, 800);
    }

    // Remove flash after animation
    setTimeout(() => {
      if (errorFlash.parentNode) {
        errorFlash.parentNode.removeChild(errorFlash);
      }
    }, 300);
  }

  recordResponse(trial, blockNumber, responded, reactionTime) {
    const isCorrect = trial.isGo ? responded : !responded;

    const dataPoint = {
      subjectId: this.subjectId,
      testName: "SART",
      blockType: this.currentBlock,
      blockNumber: blockNumber || (this.currentBlock === "trial" ? 0 : null),
      trialNumber: trial.trialNumber,
      go: trial.isGo ? 1 : 0,
      digit: trial.digit,
      fontSize: trial.fontSizeIndex,
      response: responded ? 1 : 0,
      responseOutcome: isCorrect ? 1 : 0,
      reactionTime: reactionTime || null,
      timestamp: Date.now(),
    };

    this.data.push(dataPoint);
  }
}

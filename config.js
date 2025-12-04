const CONFIG = {
  sart: {
    trialTrials: 18, // Počet trialov v trial verzii (Robertson et al., 1997: each digit 1-9 used 2x)
    realTrials: 225, // Počet trialov v real verzii (Robertson et al., 1997: each digit 1-9 used 25x)
    noGoCount: 25, // Počet číslic '3' (no-go) v real verzii (1/9 of 225 trials)
    digitDisplayTime: 250, // Čas zobrazenia číslice v ms (Robertson et al., 1997)
    maskTime: 900, // Čas zobrazenia masky v ms (Robertson et al., 1997)
  },
  nback: {
    trialTrials: 20, // Počet trialov v trial verzii (Jaeggi et al., 2010: 20+n stimuli per block)
    realTrials: 26, // Počet trialov v real verzii (standard is 20-25 per block)
    matchCount: 8, // Počet match možností (~30% match rate, Jaeggi et al., 2010)
    letterDisplayTime: 500, // Čas zobrazenia písmena v ms (Jaeggi et al., 2010)
    blankScreenTime: 2000, // Čas blank screen medzi písmenami v ms (Jaeggi et al., 2010: ISI = 2500ms)
  },
  ui: {
    colorCodeStats: true, // Farebné označenie štatistík (true = zapnuté, false = vypnuté)
  },
  // Input lag kompenzácia v ms (odpočíta sa od reakčného času pre kompenzáciu oneskorenia klávesnice)
  inputLag: 0,
  // URL pre post-test formulár (zobrazí sa po dokončení testov)
  postTestFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdc-I2TjDVgtICCQIFcvPHhHC1394k0QdX4JNO6frzkOB64yw/viewform?usp=header",
};

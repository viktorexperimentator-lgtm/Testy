// Test orchestrator - manages test order and execution
class TestOrchestrator {
  constructor(subjectId, onComplete) {
    this.subjectId = subjectId;
    this.onComplete = onComplete;
    this.allData = [];
    this.testOrder = [];
    this.currentTestIndex = 0;
  }

  async start() {
    // Randomize test order
    this.testOrder = ["SART", "N-back"];
    if (Math.random() < 0.5) {
      this.testOrder.reverse();
    }

    // Run tests in order
    await this.runNextTest();
  }

  async runNextTest() {
    if (this.currentTestIndex >= this.testOrder.length) {
      // All tests completed
      this.onComplete(this.allData);
      return;
    }

    const testName = this.testOrder[this.currentTestIndex];

    if (testName === "SART") {
      const sart = new SART(this.subjectId, (data) => {
        this.allData = this.allData.concat(data);
        this.currentTestIndex++;
        this.runNextTest();
      });
      await sart.start();
    } else if (testName === "N-back") {
      const nback = new NBack(this.subjectId, (data) => {
        this.allData = this.allData.concat(data);
        this.currentTestIndex++;
        this.runNextTest();
      });
      await nback.start();
    }
  }
}

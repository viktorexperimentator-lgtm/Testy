// ID Input validation and handling
class IDInput {
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const container = document.getElementById("app");
    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-black">
        <div class="w-full max-w-md px-6">
          <h1 class="text-3xl font-light text-white mb-8 text-center">Kognitívne Testovanie</h1>
          <div class="glass-container rounded-lg p-8">
            <label for="subjectId" class="block text-sm font-medium text-gray-300 mb-2">
              Zadajte vaše ID:
            </label>
            <input
              type="text"
              id="subjectId"
              class="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-center text-xl tracking-widest uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500 backdrop-blur-sm"
              placeholder="AB12"
              maxlength="4"
              autocomplete="off"
            />
            <p id="errorMessage" class="mt-2 text-sm text-red-400 hidden"></p>
            <div class="mt-6 text-center">
              <button
                id="submitBtn"
                class="glass-button"
              >
                Pokračovať
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const input = document.getElementById("subjectId");
    const submitBtn = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("errorMessage");

    // Auto-uppercase and format input
    input.addEventListener("input", (e) => {
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      e.target.value = value;
      this.hideError();
    });

    // Submit on Enter
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSubmit();
      }
    });

    // Submit on button click
    submitBtn.addEventListener("click", () => {
      this.handleSubmit();
    });

    // Focus input on load
    input.focus();
  }

  validateID(id) {
    // Format: 2 uppercase letters + 2 numbers
    const regex = /^[A-Z]{2}[0-9]{2}$/;
    return regex.test(id);
  }

  showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
  }

  hideError() {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.classList.add("hidden");
  }

  handleSubmit() {
    const input = document.getElementById("subjectId");
    const id = input.value.trim();

    if (!id) {
      this.showError("Prosím, zadajte vaše ID");
      return;
    }

    if (!this.validateID(id)) {
      this.showError(
        "ID musí mať formát: 2 veľké písmená + 2 čísla (napr. AB12)",
      );
      return;
    }

    this.hideError();
    this.onSubmit(id);
  }
}

/**
 * 📱 JEEP COMPASS NIGHT EAGLE - VIAGEM MANAGER MOBILE
 * Sistema completo de gerenciamento de viagens otimizado para Android
 * NexCode Solutions V3.0 Mobile
 */

class ViagemManagerMobile {
  constructor() {
    this.currentTrip = null;
    this.trips = this.loadData("trips") || [];
    this.fuelRecords = this.loadData("fuelRecords") || [];
    this.stopRecords = this.loadData("stopRecords") || [];
    this.selectedRating = 5;

    this.vehicleConfig = {
      name: "Jeep Compass Night Eagle",
      tankCapacity: 64,
      cityConsumption: 9,
      highwayConsumption: 12,
      averageConsumption: 10.5,
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupPWA();
    this.updateMobileDashboard();
    this.updateMobileStatistics();
    this.renderMobileFuelHistory();
    this.renderMobileStopsHistory();
    this.renderMobileTripsHistory();
    this.setDefaultDateTime();
    this.setupRatingStars();
    this.setupFuelLevelSlider();

    console.log("📱 Viagem Manager Mobile inicializado!");
  }

  setupEventListeners() {
    // Form submissions
    document
      .getElementById("mobile-trip-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.startMobileTrip();
      });

    document
      .getElementById("mobile-fuel-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.addMobileFuelRecord();
      });

    document
      .getElementById("mobile-stop-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.addMobileStopRecord();
      });

    // Real-time updates
    [
      "mobile-origin",
      "mobile-destination",
      "mobile-fuel-level",
      "mobile-fuel-price",
      "mobile-passengers",
    ].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("input", () => this.updateMobileEstimates());
      }
    });

    // Touch events for better mobile experience
    this.setupTouchEvents();

    // Orientation change
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.handleOrientationChange(), 100);
    });

    // Prevent zoom on inputs (iOS)
    document.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });
  }

  setupPWA() {
    // Service Worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("sw.js")
        .then((registration) => {
          console.log("🔧 SW registrado:", registration);
        })
        .catch((error) => {
          console.log("❌ SW erro:", error);
        });
    }

    // Install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    // Check if running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      document.body.classList.add("pwa-mode");
    }
  }

  setupTouchEvents() {
    // Add touch feedback to buttons
    document.querySelectorAll(".btn, .nav-item, .fab").forEach((element) => {
      element.addEventListener("touchstart", () => {
        element.style.transform = "scale(0.98)";
      });

      element.addEventListener("touchend", () => {
        setTimeout(() => {
          element.style.transform = "";
        }, 100);
      });
    });

    // Swipe gestures for tabs
    let startX = 0;
    let startY = 0;

    document.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener("touchend", (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Only horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        this.handleSwipe(deltaX > 0 ? "right" : "left");
      }

      startX = 0;
      startY = 0;
    });
  }

  handleSwipe(direction) {
    const tabs = ["dashboard", "planner", "fuel", "stops", "history"];
    const currentTab = document.querySelector(".tab-content.active").id;
    const currentIndex = tabs.indexOf(currentTab);

    let newIndex;
    if (direction === "left" && currentIndex < tabs.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === "right" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex !== undefined) {
      switchMobileTab(tabs[newIndex]);
      this.hapticFeedback();
    }
  }

  setupRatingStars() {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star) => {
      star.addEventListener("click", (e) => {
        const rating = parseInt(e.target.dataset.rating);
        this.setRating(rating);
        this.hapticFeedback();
      });
    });
  }

  setRating(rating) {
    this.selectedRating = rating;
    const stars = document.querySelectorAll(".star");
    stars.forEach((star, index) => {
      if (index < rating) {
        star.style.filter = "brightness(1.5) drop-shadow(0 0 5px gold)";
      } else {
        star.style.filter = "brightness(0.5)";
      }
    });
  }

  setupFuelLevelSlider() {
    const slider = document.getElementById("mobile-fuel-level");
    const text = document.getElementById("fuel-level-text");

    slider.addEventListener("input", (e) => {
      text.textContent = `${e.target.value}%`;
      this.updateMobileEstimates();
    });
  }

  setDefaultDateTime() {
    const now = new Date();
    const localDateTime = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
    document.getElementById("mobile-departure-date").value = localDateTime;
  }

  // === TRIP MANAGEMENT ===
  startMobileTrip() {
    this.showLoading();

    const formData = this.getMobileTripFormData();

    if (!this.validateTripData(formData)) {
      this.hideLoading();
      return;
    }

    const tripEstimates = this.calculateTripEstimates(formData);

    this.currentTrip = {
      id: Date.now(),
      ...formData,
      ...tripEstimates,
      status: "active",
      startTime: new Date(),
      fuelRecords: [],
      stopRecords: [],
      progress: 0,
    };

    this.saveData("currentTrip", this.currentTrip);
    this.updateMobileDashboard();
    this.hideLoading();

    this.showMobileAlert("success", "🚀 Viagem iniciada! Boa viagem!");
    switchMobileTab("dashboard");
    this.hapticFeedback("success");
  }

  getMobileTripFormData() {
    return {
      origin: document.getElementById("mobile-origin").value,
      destination: document.getElementById("mobile-destination").value,
      departureDate: document.getElementById("mobile-departure-date").value,
      passengers: parseInt(document.getElementById("mobile-passengers").value),
      initialFuelLevel: parseInt(
        document.getElementById("mobile-fuel-level").value
      ),
      fuelPrice: parseFloat(document.getElementById("mobile-fuel-price").value),
    };
  }

  validateTripData(data) {
    if (!data.origin || !data.destination) {
      this.showMobileAlert("danger", "❌ Preencha origem e destino!");
      return false;
    }

    if (data.origin.toLowerCase() === data.destination.toLowerCase()) {
      this.showMobileAlert(
        "warning",
        "⚠️ Origem e destino devem ser diferentes!"
      );
      return false;
    }

    return true;
  }

  calculateTripEstimates(data) {
    const estimatedDistance = this.estimateDistance(
      data.origin,
      data.destination
    );
    const estimatedTime = estimatedDistance / 80;
    const fuelNeeded =
      estimatedDistance / this.vehicleConfig.averageConsumption;
    const estimatedCost = fuelNeeded * data.fuelPrice;
    const currentFuel =
      (data.initialFuelLevel / 100) * this.vehicleConfig.tankCapacity;
    const fuelStops = Math.max(
      0,
      Math.ceil((fuelNeeded - currentFuel) / this.vehicleConfig.tankCapacity)
    );

    return {
      estimatedDistance,
      estimatedTime,
      fuelNeeded,
      estimatedCost,
      fuelStops,
      estimatedArrival: new Date(
        new Date(data.departureDate).getTime() + estimatedTime * 60 * 60 * 1000
      ),
    };
  }

  estimateDistance(origin, destination) {
    const routes = {
      "imperatriz,belem": 720,
      "imperatriz,sao luis": 350,
      "belem,sao paulo": 2100,
      "rio,sao paulo": 430,
      "brasilia,goiania": 200,
      default: 500,
    };

    const key = `${origin.toLowerCase()},${destination.toLowerCase()}`.replace(
      /\s+/g,
      ""
    );
    return routes[key] || routes["default"];
  }

  updateMobileEstimates() {
    const formData = this.getMobileTripFormData();

    if (formData.origin && formData.destination) {
      const estimates = this.calculateTripEstimates(formData);
      this.displayMobileEstimates(estimates);
    }
  }

  displayMobileEstimates(estimates) {
    const estimatesDiv = document.getElementById("mobile-estimates");
    const estimatesContent = document.getElementById("mobile-trip-estimates");

    estimatesContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${
                      estimates.estimatedDistance
                    }</span>
                    <span class="stat-label">Km Total</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${estimates.estimatedTime.toFixed(
                      1
                    )}h</span>
                    <span class="stat-label">Tempo</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${estimates.fuelNeeded.toFixed(
                      1
                    )}L</span>
                    <span class="stat-label">Combustível</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">R$ ${estimates.estimatedCost.toFixed(
                      0
                    )}</span>
                    <span class="stat-label">Custo</span>
                </div>
            </div>
            <div class="alert alert-success">
                <strong>🎯 Previsão:</strong> Chegada às ${estimates.estimatedArrival.toLocaleTimeString(
                  "pt-BR",
                  { hour: "2-digit", minute: "2-digit" }
                )}
                ${
                  estimates.fuelStops > 0
                    ? `<br><strong>⛽ Paradas:</strong> ${estimates.fuelStops} abastecimento(s)`
                    : ""
                }
            </div>
        `;

    estimatesDiv.style.display = "block";
  }

  // === FUEL MANAGEMENT ===
  addMobileFuelRecord() {
    this.showLoading();

    const fuelData = this.getMobileFuelFormData();

    if (!this.validateFuelData(fuelData)) {
      this.hideLoading();
      return;
    }

    const fuelRecord = {
      id: Date.now(),
      timestamp: new Date(),
      tripId: this.currentTrip?.id || null,
      ...fuelData,
      rating: this.selectedRating,
      totalCost: fuelData.pricePerLiter * fuelData.liters,
      costPerKm: this.calculateCostPerKm(fuelData),
    };

    this.fuelRecords.push(fuelRecord);
    this.saveData("fuelRecords", this.fuelRecords);

    if (this.currentTrip) {
      this.currentTrip.fuelRecords.push(fuelRecord.id);
      this.saveData("currentTrip", this.currentTrip);
    }

    this.renderMobileFuelHistory();
    this.updateMobileStatistics();
    this.closeFuelModal();
    this.clearMobileForm("mobile-fuel-form");
    this.hideLoading();

    this.showMobileAlert("success", "⛽ Abastecimento registrado!");
    this.hapticFeedback("success");
  }

  getMobileFuelFormData() {
    return {
      city: document.getElementById("mobile-fuel-city").value,
      gasStation: document.getElementById("mobile-gas-station").value,
      pricePerLiter: parseFloat(
        document.getElementById("mobile-fuel-price-liter").value
      ),
      liters: parseFloat(document.getElementById("mobile-fuel-liters").value),
      odometer: parseInt(document.getElementById("mobile-odometer").value),
      notes: document.getElementById("mobile-fuel-notes").value,
    };
  }

  validateFuelData(data) {
    if (!data.city || !data.gasStation) {
      this.showMobileAlert("danger", "❌ Preencha cidade e posto!");
      return false;
    }

    if (data.pricePerLiter <= 0 || data.liters <= 0) {
      this.showMobileAlert("danger", "❌ Valores devem ser maiores que zero!");
      return false;
    }

    return true;
  }

  calculateCostPerKm(fuelData) {
    if (this.fuelRecords.length === 0) return 0;

    const lastRecord = this.fuelRecords[this.fuelRecords.length - 1];
    const kmTraveled = fuelData.odometer - lastRecord.odometer;

    if (kmTraveled <= 0) return 0;

    return (fuelData.pricePerLiter * fuelData.liters) / kmTraveled;
  }

  renderMobileFuelHistory() {
    const container = document.getElementById("mobile-fuel-history");

    if (this.fuelRecords.length === 0) {
      container.innerHTML = `
                <div class="alert alert-warning">
                    📊 Nenhum abastecimento registrado.
                </div>
            `;
      return;
    }

    const sortedRecords = [...this.fuelRecords].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    container.innerHTML = sortedRecords
      .map(
        (record) => `
            <div class="history-item">
                <div class="history-header">⛽ ${record.gasStation}</div>
                <div class="history-details">
                    <div class="history-detail">
                        <span class="detail-label">Cidade</span>
                        <span class="detail-value">${record.city}</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Total</span>
                        <span class="detail-value">R$ ${record.totalCost.toFixed(
                          2
                        )}</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Litros</span>
                        <span class="detail-value">${record.liters}L</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Avaliação</span>
                        <span class="detail-value">${"⭐".repeat(
                          record.rating
                        )}</span>
                    </div>
                </div>
                ${
                  record.notes
                    ? `<div style="margin-top: 10px; font-size: 0.9rem; color: var(--text-gray);">${record.notes}</div>`
                    : ""
                }
            </div>
        `
      )
      .join("");
  }

  // === STOP MANAGEMENT ===
  addMobileStopRecord() {
    this.showLoading();

    const stopData = this.getMobileStopFormData();

    if (!this.validateStopData(stopData)) {
      this.hideLoading();
      return;
    }

    const stopRecord = {
      id: Date.now(),
      timestamp: new Date(),
      tripId: this.currentTrip?.id || null,
      ...stopData,
      duration: this.calculateStopDuration(
        stopData.arrivalTime,
        stopData.departureTime
      ),
    };

    this.stopRecords.push(stopRecord);
    this.saveData("stopRecords", this.stopRecords);

    if (this.currentTrip) {
      this.currentTrip.stopRecords.push(stopRecord.id);
      this.saveData("currentTrip", this.currentTrip);
    }

    this.renderMobileStopsHistory();
    this.updateMobileStatistics();
    this.closeStopModal();
    this.clearMobileForm("mobile-stop-form");
    this.hideLoading();

    this.showMobileAlert("success", "🍽️ Parada registrada!");
    this.hapticFeedback("success");
  }

  getMobileStopFormData() {
    return {
      city: document.getElementById("mobile-stop-city").value,
      establishment: document.getElementById("mobile-establishment").value,
      type: document.getElementById("mobile-stop-type").value,
      cost: parseFloat(document.getElementById("mobile-stop-cost").value),
      arrivalTime: document.getElementById("mobile-arrival-time").value,
      departureTime: document.getElementById("mobile-departure-time").value,
      notes: document.getElementById("mobile-stop-notes").value,
    };
  }

  validateStopData(data) {
    if (!data.city || !data.establishment || !data.type) {
      this.showMobileAlert(
        "danger",
        "❌ Preencha todos os campos obrigatórios!"
      );
      return false;
    }

    if (data.cost <= 0) {
      this.showMobileAlert("danger", "❌ Valor deve ser maior que zero!");
      return false;
    }

    if (data.arrivalTime >= data.departureTime) {
      this.showMobileAlert(
        "warning",
        "⚠️ Horário de saída deve ser posterior!"
      );
      return false;
    }

    return true;
  }

  calculateStopDuration(arrival, departure) {
    const arrivalDate = new Date(`2000-01-01T${arrival}`);
    const departureDate = new Date(`2000-01-01T${departure}`);
    return Math.round((departureDate - arrivalDate) / (1000 * 60));
  }

  renderMobileStopsHistory() {
    const container = document.getElementById("mobile-stops-history");

    if (this.stopRecords.length === 0) {
      container.innerHTML = `
                <div class="alert alert-warning">
                    🍽️ Nenhuma parada registrada.
                </div>
            `;
      return;
    }

    const sortedRecords = [...this.stopRecords].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    container.innerHTML = sortedRecords
      .map(
        (record) => `
            <div class="history-item">
                <div class="history-header">🍽️ ${record.establishment}</div>
                <div class="history-details">
                    <div class="history-detail">
                        <span class="detail-label">Cidade</span>
                        <span class="detail-value">${record.city}</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Tipo</span>
                        <span class="detail-value">${this.getStopTypeLabel(
                          record.type
                        )}</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Custo</span>
                        <span class="detail-value">R$ ${record.cost.toFixed(
                          2
                        )}</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Duração</span>
                        <span class="detail-value">${Math.floor(
                          record.duration / 60
                        )}h ${record.duration % 60}min</span>
                    </div>
                </div>
                ${
                  record.notes
                    ? `<div style="margin-top: 10px; font-size: 0.9rem; color: var(--text-gray);">${record.notes}</div>`
                    : ""
                }
            </div>
        `
      )
      .join("");
  }

  getStopTypeLabel(type) {
    const types = {
      breakfast: "☕ Café",
      lunch: "🍽️ Almoço",
      snack: "🥪 Lanche",
      dinner: "🍽️ Jantar",
      rest: "😴 Descanso",
    };
    return types[type] || type;
  }

  // === DASHBOARD ===
  updateMobileDashboard() {
    const statusDiv = document.getElementById("current-trip-status");

    this.currentTrip = this.loadData("currentTrip");

    if (!this.currentTrip) {
      statusDiv.innerHTML = `
                <div class="alert alert-warning">
                    <strong>📍 Nenhuma viagem ativa</strong><br>
                    Toque em "+" para iniciar uma nova viagem.
                </div>
            `;
      document.getElementById("fab-button").innerHTML = "➕";
      return;
    }

    const progress = this.calculateTripProgress();

    statusDiv.innerHTML = `
            <div class="trip-status">
                <div class="trip-route">🚗 ${this.currentTrip.origin} → ${
      this.currentTrip.destination
    }</div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">Progresso: ${progress}%</div>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${
                          this.currentTrip.estimatedDistance
                        }</span>
                        <span class="stat-label">Km</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">R$ ${this.currentTrip.estimatedCost.toFixed(
                          0
                        )}</span>
                        <span class="stat-label">Custo</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${
                          this.currentTrip.fuelRecords?.length || 0
                        }</span>
                        <span class="stat-label">Combustível</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${
                          this.currentTrip.stopRecords?.length || 0
                        }</span>
                        <span class="stat-label">Paradas</span>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="viagemManagerMobile.pauseTrip()">
                        ⏸️ Pausar
                    </button>
                    <button class="btn" onclick="viagemManagerMobile.finishTrip()">
                        🏁 Finalizar
                    </button>
                </div>
            </div>
        `;

    document.getElementById("fab-button").innerHTML = "🏁";
  }

  calculateTripProgress() {
    if (!this.currentTrip) return 0;

    const now = new Date();
    const start = new Date(this.currentTrip.startTime);
    const estimatedEnd = new Date(this.currentTrip.estimatedArrival);

    const elapsed = now - start;
    const total = estimatedEnd - start;

    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  updateMobileStatistics() {
    const totalTrips = this.trips.length + (this.currentTrip ? 1 : 0);
    const totalKm = this.trips.reduce(
      (sum, trip) => sum + trip.estimatedDistance,
      0
    );
    const avgConsumption = this.calculateAverageConsumption();
    const totalSpent = this.calculateTotalSpent();

    document.getElementById("mobile-total-trips").textContent = totalTrips;
    document.getElementById("mobile-total-km").textContent =
      totalKm.toLocaleString();
    document.getElementById("mobile-avg-consumption").textContent =
      avgConsumption.toFixed(1);
    document.getElementById(
      "mobile-total-spent"
    ).textContent = `R$ ${totalSpent.toFixed(0)}`;
  }

  calculateAverageConsumption() {
    if (this.fuelRecords.length < 2)
      return this.vehicleConfig.averageConsumption;

    let totalKm = 0;
    let totalLiters = 0;

    for (let i = 1; i < this.fuelRecords.length; i++) {
      const current = this.fuelRecords[i];
      const previous = this.fuelRecords[i - 1];

      totalKm += current.odometer - previous.odometer;
      totalLiters += current.liters;
    }

    return totalKm > 0
      ? totalKm / totalLiters
      : this.vehicleConfig.averageConsumption;
  }

  calculateTotalSpent() {
    const fuelCosts = this.fuelRecords.reduce(
      (sum, record) => sum + record.totalCost,
      0
    );
    const stopCosts = this.stopRecords.reduce(
      (sum, record) => sum + record.cost,
      0
    );
    return fuelCosts + stopCosts;
  }

  renderMobileTripsHistory() {
    const container = document.getElementById("mobile-trips-list");

    if (this.trips.length === 0) {
      container.innerHTML = `
                <div class="alert alert-warning">
                    📊 Nenhuma viagem concluída ainda.
                </div>
            `;
      return;
    }

    const sortedTrips = [...this.trips].sort(
      (a, b) => new Date(b.endTime) - new Date(a.endTime)
    );

    container.innerHTML = sortedTrips
      .map(
        (trip) => `
            <div class="history-item">
                <div class="history-header">🚗 ${trip.origin} → ${
          trip.destination
        }</div>
                <div class="history-details">
                    <div class="history-detail">
                        <span class="detail-label">Data</span>
                        <span class="detail-value">${new Date(
                          trip.startTime
                        ).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Distância</span>
                        <span class="detail-value">${
                          trip.estimatedDistance
                        } km</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Custo</span>
                        <span class="detail-value">R$ ${trip.totalCost.toFixed(
                          2
                        )}</span>
                    </div>
                    <div class="history-detail">
                        <span class="detail-label">Duração</span>
                        <span class="detail-value">${this.formatDuration(
                          trip.actualDuration
                        )}</span>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }

  // === TRIP CONTROL ===
  pauseTrip() {
    if (!this.currentTrip) return;

    this.currentTrip.status = "paused";
    this.saveData("currentTrip", this.currentTrip);

    this.showMobileAlert("warning", "⏸️ Viagem pausada!");
    this.hapticFeedback();
  }

  finishTrip() {
    if (!this.currentTrip) return;

    if (!confirm("🏁 Finalizar esta viagem?")) {
      return;
    }

    const endTime = new Date();
    const actualDuration = Math.round(
      (endTime - new Date(this.currentTrip.startTime)) / (1000 * 60)
    );
    const totalFuelCost = this.fuelRecords
      .filter((record) => record.tripId === this.currentTrip.id)
      .reduce((sum, record) => sum + record.totalCost, 0);
    const totalStopCost = this.stopRecords
      .filter((record) => record.tripId === this.currentTrip.id)
      .reduce((sum, record) => sum + record.cost, 0);

    const completedTrip = {
      ...this.currentTrip,
      status: "completed",
      endTime,
      actualDuration,
      totalCost: totalFuelCost + totalStopCost,
    };

    this.trips.push(completedTrip);
    this.saveData("trips", this.trips);
    this.removeData("currentTrip");
    this.currentTrip = null;

    this.updateMobileDashboard();
    this.updateMobileStatistics();
    this.renderMobileTripsHistory();

    this.showMobileAlert("success", "🏁 Viagem finalizada! Parabéns!");
    this.hapticFeedback("success");
  }

  // === UI HELPERS ===
  showMobileAlert(type, message) {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.innerHTML = message;
    alert.style.position = "fixed";
    alert.style.top = "80px";
    alert.style.left = "15px";
    alert.style.right = "15px";
    alert.style.zIndex = "9999";
    alert.style.animation = "slideIn 0.3s ease";

    document.body.appendChild(alert);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.style.animation = "slideOut 0.3s ease";
        setTimeout(() => {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 300);
      }
    }, 3000);
  }

  showLoading() {
    document.body.classList.add("loading");
  }

  hideLoading() {
    document.body.classList.remove("loading");
  }

  hapticFeedback(type = "light") {
    if (navigator.vibrate) {
      const patterns = {
        light: [50],
        success: [100, 50, 100],
        error: [200, 100, 200],
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }

  handleOrientationChange() {
    // Força um redraw após mudança de orientação
    document.body.style.height = "100vh";
    setTimeout(() => {
      document.body.style.height = "";
    }, 100);
  }

  clearMobileForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      if (input.type !== "number" && input.type !== "range") {
        input.value = "";
      }
    });

    // Reset rating
    this.setRating(5);
  }

  showInstallBanner() {
    const banner = document.createElement("div");
    banner.className = "install-banner";
    banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: var(--primary); color: var(--dark); margin: 15px; border-radius: 12px;">
                <span>📱</span>
                <div style="flex: 1;">
                    <strong>Instalar App</strong><br>
                    <small>Adicione à tela inicial para acesso rápido!</small>
                </div>
                <button class="btn-small" onclick="viagemManagerMobile.installApp()">Instalar</button>
            </div>
        `;

    document.querySelector(".main-content").prepend(banner);
  }

  installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("🎉 App instalado!");
          this.hapticFeedback("success");
        }
        this.deferredPrompt = null;
      });
    }
  }

  // === DATA MANAGEMENT ===
  saveData(key, data) {
    try {
      localStorage.setItem(`viagemManagerMobile_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  }

  loadData(key) {
    try {
      const data = localStorage.getItem(`viagemManagerMobile_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erro ao carregar:", error);
      return null;
    }
  }

  removeData(key) {
    try {
      localStorage.removeItem(`viagemManagerMobile_${key}`);
    } catch (error) {
      console.error("Erro ao remover:", error);
    }
  }
}

// === GLOBAL FUNCTIONS ===
function switchMobileTab(tabName) {
  // Remove active class
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Add active class
  document
    .querySelector(`[onclick="switchMobileTab('${tabName}')"]`)
    .classList.add("active");
  document.getElementById(tabName).classList.add("active");

  // Update FAB
  const fab = document.getElementById("fab-button");
  if (tabName === "dashboard" && viagemManagerMobile.currentTrip) {
    fab.innerHTML = "🏁";
    fab.onclick = () => viagemManagerMobile.finishTrip();
  } else {
    fab.innerHTML = "➕";
    fab.onclick = () => switchMobileTab("planner");
  }

  // Update content
  if (tabName === "dashboard") {
    viagemManagerMobile.updateMobileDashboard();
  } else if (tabName === "history") {
    viagemManagerMobile.renderMobileTripsHistory();
  }

  viagemManagerMobile.hapticFeedback();
}

function openFuelModal() {
  document.getElementById("mobile-fuel-modal").classList.add("active");
  viagemManagerMobile.hapticFeedback();
}

function closeFuelModal() {
  document.getElementById("mobile-fuel-modal").classList.remove("active");
}

function openStopModal() {
  document.getElementById("mobile-stop-modal").classList.add("active");
  viagemManagerMobile.hapticFeedback();
}

function closeStopModal() {
  document.getElementById("mobile-stop-modal").classList.remove("active");
}

// === INITIALIZATION ===
let viagemManagerMobile;

document.addEventListener("DOMContentLoaded", () => {
  viagemManagerMobile = new ViagemManagerMobile();

  // Close modals on outside click
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("active");
    }
  });

  // Prevent context menu on long press
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  console.log("📱 Jeep Viagem Mobile carregado com sucesso!");
});

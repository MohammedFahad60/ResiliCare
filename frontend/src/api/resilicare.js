const API_BASE_URL = "http://127.0.0.1:8000/api";

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API ${response.status}: ${
        errorText || response.statusText
      }`
    );
  }

  return response.json();
}

// --------------------------------------------------
// INVENTORY
// --------------------------------------------------

export async function getInventory() {
  return request("/inventory/");
}

// --------------------------------------------------
// INTELLIGENCE
// --------------------------------------------------

export async function getInventoryIntelligence(
  facilityCode,
  medicineName
) {
  return request(
    `/intelligence/${encodeURIComponent(
      facilityCode
    )}/${encodeURIComponent(medicineName)}`
  );
}

// --------------------------------------------------
// CRISIS SIMULATION
// --------------------------------------------------

export async function simulateCrisis(scenario) {
  return request("/crisis/simulate", {
    method: "POST",
    body: JSON.stringify(scenario),
  });
}

// --------------------------------------------------
// REDISTRIBUTION
// --------------------------------------------------

export async function calculateRedistribution(
  scenario
) {
  return request("/crisis/redistribution", {
    method: "POST",
    body: JSON.stringify(scenario),
  });
}

// --------------------------------------------------
// IMPACT
// --------------------------------------------------

export async function calculateImpact(scenario) {
  return request("/crisis/impact", {
    method: "POST",
    body: JSON.stringify(scenario),
  });
}

// --------------------------------------------------
// NETWORK
// --------------------------------------------------

export async function getNetworkSummary() {
  return request("/network/summary");
}

export async function getNetworkFacilities() {
  return request("/network/facilities");
}

export async function getNetworkFacility(facilityCode) {
  return request(
    `/network/facilities/${encodeURIComponent(facilityCode)}`
  );
}

export async function explainTransfer(
  transfer,
  scenario
) {
  return request("/explain/transfer", {
    method: "POST",
    body: JSON.stringify({
      medicine: transfer.medicine,

      quantity: Number(
        transfer.quantity || 0
      ),

      distance_km: Number(
        transfer.distanceKm || 0
      ),

      source_facility:
        transfer.sourceName,

      source_code:
        transfer.sourceCode,

      destination_facility:
        transfer.destinationName,

      destination_code:
        transfer.destinationCode,

      scenario,

      // Actual optimizer evidence
      reasoning:
        transfer.reasoning || {},
    }),
  });
}


export async function generateCrisisBriefing(
  scenario,
  network,
  impact,
  recommendations
) {
  return request("/crisis/briefing", {
    method: "POST",
    body: JSON.stringify({
      scenario,
      network,
      impact,
      recommendations,
    }),
  });
}

export async function askResiliCare(
  question,
  scenario,
  network,
  impact,
  recommendations
) {
  return request("/crisis/ask", {
    method: "POST",
    body: JSON.stringify({
      question,
      scenario,
      network,
      impact,
      recommendations,
    }),
  });
}

export async function getNetworkWarnings() {
  const response = await fetch(
    `${API_BASE_URL}/network/warnings`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load network warnings: ${response.status}`
    );
  }

  return response.json();
}

export async function getFederatedSummary() {
  const response = await fetch(
    `${API_BASE_URL}/federated/summary`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load federated summary: ${response.status}`
    );
  }

  return response.json();
}

export async function runFederatedTraining() {
  const response = await fetch(
    `${API_BASE_URL}/federated/train`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Federated training failed: ${response.status}`
    );
  }

  return response.json();
}
# ResiliCare

> **Predict. Prepare. Protect.**

## 🚀 Live Demo

- **Frontend:** https://resilicare-992ca.web.app
- **Backend:** https://resilicare.onrender.com
- **Health Check:** https://resilicare.onrender.com/health
- **Source Code:** https://github.com/MohammedFahad60/ResiliCare

ResiliCare is an AI-powered healthcare resilience and resource intelligence platform designed to help healthcare networks anticipate resource failures before they become critical.

Instead of only showing the current condition of healthcare facilities, ResiliCare combines **demand forecasting, inventory intelligence, crisis simulation, risk detection, resource redistribution, impact analysis, and federated learning concepts** into a single decision-support platform.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The ResiliCare Approach](#the-resilicare-approach)
- [Core Intelligence Loop](#core-intelligence-loop)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Strategy](#data-strategy)
- [AI and Analytics](#ai-and-analytics)
- [Healthcare Risk Intelligence](#healthcare-risk-intelligence)
- [Crisis Simulation](#crisis-simulation)
- [Resource Redistribution](#resource-redistribution)
- [Impact Analysis](#impact-analysis)
- [Federated Intelligence](#federated-intelligence)
- [Gemini Integration](#gemini-integration)
- [API Overview](#api-overview)
- [Frontend](#frontend)
- [Backend](#backend)
- [Database](#database)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [CORS](#cors)
- [Example Crisis Scenario](#example-crisis-scenario)
- [Demonstrated Results](#demonstrated-results)
- [Limitations and Responsible Use](#limitations-and-responsible-use)
- [Future Roadmap](#future-roadmap)
- [Why ResiliCare](#why-resilicare)
- [Project Status](#project-status)
- [Author](#author)
- [License](#license)

---

# Overview

Healthcare resilience is not only about having enough resources today. A facility can appear healthy while moving toward a medicine stock-out, capacity shortage, or supply disruption.

ResiliCare attempts to answer four operational questions:

1. **What is happening now?**
2. **What is likely to happen next?**
3. **What happens if the healthcare network is placed under stress?**
4. **What intervention can reduce the projected impact?**

The platform creates an intelligence loop:

```text
Healthcare Data
      ↓
Understand Current State
      ↓
Forecast Demand
      ↓
Detect Emerging Risk
      ↓
Simulate Crisis
      ↓
Identify Bottlenecks
      ↓
Optimize Resource Redistribution
      ↓
Estimate Intervention Impact
      ↓
Explain the Decision
      ↓
Learn Across Regions
```

---

# The Problem

Healthcare systems can experience cascading failures when demand increases or supply becomes constrained.

Examples include:

- sudden increases in patient footfall
- disease outbreaks
- medicine consumption spikes
- supply-chain disruptions
- delayed replenishment
- insufficient safety stock
- increasing bed occupancy
- reduced healthcare workforce availability
- uneven resource distribution between facilities

A dashboard that only reports current inventory may identify a shortage after it has already occurred.

ResiliCare focuses on the **future state of the network**.

---

# The ResiliCare Approach

ResiliCare models healthcare facilities as interconnected resource nodes.

Each facility can contain information about:

- facility identity
- facility type
- district
- state
- geographic coordinates
- medicine inventory
- daily consumption
- safety stock
- incoming stock
- lead time
- projected demand
- projected stock coverage
- stock-out risk
- facility-level risk

The platform then uses this information to create a simulated healthcare resilience network.

### Core principle

> **Don't just detect failure. Simulate failure, understand the weakest links, and evaluate interventions before acting.**

---

# Core Intelligence Loop

```text
┌─────────────┐
│   COLLECT   │
│ Healthcare  │
│    Data     │
└──────┬──────┘
       ↓
┌─────────────┐
│  UNDERSTAND │
│ Current     │
│ Network     │
└──────┬──────┘
       ↓
┌─────────────┐
│   PREDICT   │
│ Demand &    │
│ Stock Risk  │
└──────┬──────┘
       ↓
┌─────────────┐
│    DETECT   │
│ Early       │
│ Warnings    │
└──────┬──────┘
       ↓
┌─────────────┐
│   SIMULATE  │
│ Crisis      │
│ Scenarios   │
└──────┬──────┘
       ↓
┌─────────────┐
│   OPTIMIZE  │
│ Resource    │
│ Transfers   │
└──────┬──────┘
       ↓
┌─────────────┐
│     ACT     │
│ Intervention│
│ Planning    │
└──────┬──────┘
       ↓
┌─────────────┐
│    LEARN    │
│ Federated   │
│ Intelligence│
└─────────────┘
```

---

# Key Features

## 1. National-Scale Network View

The Network module provides a geographic view of healthcare facilities.

It displays:

- facility locations
- facility risk scores
- facility status
- inventory-node counts
- critical inventory nodes
- projected stock-out nodes
- facility details

Facilities can be filtered by:

- All
- Healthy
- At Risk
- Critical

---

## 2. Medicine-Level Intelligence

Selecting a facility exposes its medicine inventory.

For each medicine, ResiliCare can display:

- medicine name
- category
- dosage/formulation
- current stock
- safety stock
- daily consumption
- lead time
- days of coverage
- risk score
- risk status
- projected demand
- projected stock
- stock-out prediction

The platform treats medicines as individual inventory SKUs rather than only broad medicine categories.

---

## 3. Early Warning Center

The Early Warning Center identifies emerging inventory risks.

Warning types include:

```text
STOCKOUT
STOCKOUT_RISK
SAFETY_STOCK
REPLENISHMENT
```

Warnings are generated from operational indicators such as:

- current stock
- daily consumption
- safety stock
- lead time
- stock coverage

Users can search and filter warnings and open an intelligence view for the affected inventory node.

---

## 4. Demand Forecasting

ResiliCare contains a demand forecasting pipeline based on historical consumption data.

The training dataset used during development contains:

```text
Facilities: 100
Medicine SKUs: 106
Historical days: 90
Records: 719,190
```

The forecasting model uses temporal features such as:

- day of week
- day of month
- month
- previous-day demand
- seven-day lag
- seven-day rolling demand
- fourteen-day rolling demand

The current model implementation uses:

```text
RandomForestRegressor
```

with:

```text
n_estimators = 150
max_depth = 12
random_state = 42
n_jobs = -1
```

The service generates a seven-day recursive forecast.

---

# System Architecture

```text
                         ┌───────────────────────────┐
                         │        React Frontend     │
                         │                           │
                         │ Network                   │
                         │ Crisis Lab                │
                         │ Forecasts                 │
                         │ Resources                 │
                         │ Federated Intelligence    │
                         └─────────────┬─────────────┘
                                       │
                                  REST APIs
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │       FastAPI Backend     │
                         │                           │
                         │ Facilities                │
                         │ Inventory                 │
                         │ Intelligence              │
                         │ Crisis Simulation         │
                         │ Redistribution            │
                         │ Impact Analysis           │
                         │ Federated Intelligence    │
                         └─────────────┬─────────────┘
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             │                         │                         │
             ▼                         ▼                         ▼
      ┌────────────┐           ┌──────────────┐          ┌──────────────┐
      │ PostgreSQL │           │ ML Services  │          │ Gemini API   │
      │ / Supabase │           │              │          │              │
      │            │           │ Forecasting  │          │ Explanations │
      │ Facilities │           │ Risk Engine  │          │ Briefings    │
      │ Medicines  │           │ Simulation   │          │ Chat         │
      │ Inventory  │           │ Optimization │          │              │
      └────────────┘           └──────────────┘          └──────────────┘
```

---

# Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | UI framework |
| Vite | Frontend build tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Leaflet | Healthcare network map |
| Leaflet | Interactive maps |
| Recharts | Data visualization |
| Lucide React | UI icons |

## Backend

| Technology | Purpose |
|---|---|
| Python | Backend and analytics |
| FastAPI | REST API |
| SQLAlchemy | Database ORM |
| PostgreSQL | Relational database |
| Pandas | Data processing |
| NumPy | Numerical operations |
| scikit-learn | Machine learning |
| Joblib | Model persistence |
| OR-Tools | Optimization |
| Google GenAI | Generative AI |
| Uvicorn | ASGI server |

## Infrastructure

| Technology | Purpose |
|---|---|
| Supabase | Managed PostgreSQL |
| Render | FastAPI deployment |
| Firebase Hosting | React production deployment |
| Vercel | Previous/alternate React deployment |
| UptimeRobot | Backend health monitoring |
| GitHub | Source control |

---

# Project Structure

```text
ResiliCare/
│
├── backend/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── facilities.py
│   │   │   ├── inventory.py
│   │   │   ├── dashboard.py
│   │   │   ├── intelligence.py
│   │   │   ├── crisis.py
│   │   │   ├── network.py
│   │   │   ├── explain.py
│   │   │   ├── crisis_briefing.py
│   │   │   └── crisis_chat.py
│   │   │
│   │   └── services/
│   │       ├── risk_engine.py
│   │       ├── forecast_service.py
│   │       ├── future_risk_engine.py
│   │       ├── crisis_simulator.py
│   │       ├── bottleneck_detector.py
│   │       ├── redistribution_engine.py
│   │       ├── optimization_engine.py
│   │       ├── intervention_simulator.py
│   │       └── impact_engine.py
│   │
│   ├── data/
│   │   └── generated/
│   │       └── demand_model.joblib
│   │
│   ├── scripts/
│   │   ├── generate_data.py
│   │   ├── generate_demand_history.py
│   │   └── train_demand_model.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   │
│   │   ├── api/
│   │   │   └── resilicare.js
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── overview/
│   │   │   ├── crisis/
│   │   │   └── resources/
│   │   │
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   │
│   └── package.json
│
└── README.md
```

---

# Data Strategy

A major design consideration is the availability of healthcare operational data.

Public healthcare datasets can provide useful contextual information such as:

- healthcare facility locations
- population indicators
- health infrastructure
- disease trends
- patient activity indicators
- public health statistics

However, facility-level operational information such as real-time inventory, staff availability, replenishment status, and internal consumption can be restricted or unavailable.

Therefore, the development version of ResiliCare uses a hybrid approach:

```text
Public / contextual healthcare information
                  +
Synthetic operational healthcare data
                  ↓
         ResiliCare data layer
```

The synthetic operational layer is designed to represent realistic relationships between:

```text
Facility
   ↓
Patient Activity
   ↓
Medicine Consumption
   ↓
Inventory Depletion
   ↓
Stock Coverage
   ↓
Risk
```

The platform should not be interpreted as having direct access to confidential live government inventory systems.

---

# AI and Analytics

ResiliCare combines several analytical components.

## Demand Forecasting

Historical demand is used to predict upcoming consumption.

```text
Historical Consumption
        ↓
Temporal Feature Engineering
        ↓
Random Forest Model
        ↓
7-Day Forecast
        ↓
Projected Inventory
```

---

## Risk Engine

The risk engine considers multiple inventory conditions.

Conceptually:

```text
Current Stock
      +
Daily Consumption
      +
Lead Time
      +
Safety Stock
      +
Forecast Demand
      ↓
Inventory Risk
```

A projected stock-out before replenishment increases risk.

A safety-stock breach increases risk.

Low projected coverage increases risk.

---

# Healthcare Risk Intelligence

ResiliCare classifies facility and inventory conditions into:

```text
HEALTHY
AT RISK
CRITICAL
```

The interface uses thresholds around the calculated risk score.

The current frontend classification is:

```text
Risk >= 70  → Critical
Risk >= 40  → At Risk
Risk < 40   → Healthy
```

These thresholds are configurable and should not be treated as clinical standards.

---

# Crisis Simulation

The Crisis Lab allows users to stress-test the healthcare network.

A scenario can contain:

```json
{
  "demand_increase_percent": 50,
  "supply_disruption_days": 5,
  "staff_reduction_percent": 10,
  "bed_occupancy_increase_percent": 30
}
```

The simulation evaluates how these conditions can affect the healthcare network.

### Scenario dimensions

#### Demand increase

Represents increased consumption caused by higher healthcare demand.

#### Supply disruption

Represents delays or interruptions in replenishment.

#### Staff reduction

Represents reduced operational capacity.

#### Bed occupancy increase

Represents increased pressure on healthcare capacity.

---

# Resource Redistribution

After simulating a crisis, ResiliCare identifies facilities that may have surplus resources and facilities that may require additional resources.

The redistribution engine considers:

```text
Current Stock
+
Daily Consumption
+
Lead Time
+
Safety Stock
+
Facility Location
```

A simplified inventory requirement is:

```text
Required Stock =
Daily Consumption × Lead Time
+
Safety Stock
```

For a donor:

```text
Surplus =
max(0, Current Stock - Required Stock)
```

For a recipient:

```text
Shortage =
max(0, Required Stock - Current Stock)
```

The optimizer then evaluates feasible source-destination pairs.

Self-transfers are excluded.

Distance is considered when selecting feasible transfers.

---

# Impact Analysis

ResiliCare does not stop after producing recommendations.

The impact engine applies the proposed transfers to a simulated copy of the inventory state.

This creates:

```text
BEFORE
  ↓
Crisis State
  ↓
Proposed Redistribution
  ↓
AFTER
```

The platform can then compare:

- projected stock-outs
- critical inventory nodes
- at-risk inventory nodes
- risk scores
- stock coverage
- facility-level status

This provides a **before-vs-after intervention simulation**.

Important:

> These are simulated intervention outcomes, not guarantees of real-world outcomes.

---

# Demonstrated Results

During development, the redistribution and impact pipeline was tested using a severe simulated crisis.

The scenario was:

```text
Demand increase:              50%
Supply disruption:             5 days
Staff reduction:              10%
Bed occupancy increase:       30%
```

The tested redistribution produced:

```text
Recommendations:             571
Units to transfer:        18,793.78
Source facilities:             97
Destination facilities:        89
Medicines covered:             73
```

The before-vs-after simulation showed:

```text
Stock-out nodes before:      5,646
Stock-out nodes after:       5,545
Reduction:                     101
```

It also showed:

```text
Critical inventory nodes:
Before: 1,533
After:  1,503
Reduction: 30
```

Facility-level results:

```text
Facilities improved:     86
Facilities worsened:     11
Facilities unchanged:     3
```

Average risk score changed from:

```text
44.92 → 44.23
```

The simulated results demonstrate how the intervention engine can be evaluated quantitatively.

They should not be interpreted as evidence of performance on real-world healthcare systems without validation using representative operational data.

---

# Federated Intelligence

ResiliCare includes a federated-learning simulation designed around the idea that healthcare regions may want to collaborate without directly exchanging raw facility-level data.

The demonstrated federated configuration includes:

```text
Federated rounds:        5
Regional nodes:          5
Facilities:            100
Samples:            65,840
Local models:            5
```

The simulated global model reports:

```text
Baseline accuracy:       87.65%
Global accuracy:         90.45%
Improvement:              2.80%
```

The conceptual architecture is:

```text
Region A ──┐
Region B ──┤
Region C ──┼──> Local Training
Region D ──┤
Region E ──┘
                 ↓
          Model Updates
                 ↓
       Federated Aggregation
                 ↓
           Global Model
```

The platform represents the privacy principle as:

```text
Raw facility data shared: NO
Shared artifact:          Model updates
Aggregation:              Federated averaging
```

This is a development simulation of federated intelligence and should not be interpreted as a production privacy guarantee.

---

# Gemini Integration

ResiliCare uses Google's Gemini API as a generative intelligence and decision-support layer.

Current and demonstrated applications include:

- explaining risk signals
- generating crisis briefings
- explaining recommended interventions
- answering operational questions
- converting complex analytics into human-readable summaries

The architectural principle is:

```text
Structured Analytics
       ↓
Risk / Forecast / Simulation Results
       ↓
Gemini
       ↓
Human-readable Explanation
```

Generative AI is positioned as an **explanation and decision-support layer**, not as the source of raw operational truth.

### Gemini System Instructions

ResiliCare uses a dedicated system instruction to control
Gemini's behavior when explaining analytics and recommendations.

The instruction requires Gemini to:

- use only supplied ResiliCare data
- distinguish observed, predicted, simulated, and recommended information
- explain the reasoning behind detected risks
- explain resource redistribution recommendations
- identify missing information instead of inventing values
- clearly label crisis results as simulated projections
- avoid presenting generated explanations as clinical or operational truth

The system instruction is maintained in:

`backend/prompts/gemini_system_instruction.md`

This prompt is designed to handle edge cases such as incomplete
data, missing facility information, conflicting signals, and
simulated scenarios.

### Google Technology Integration

ResiliCare uses Google technologies in the following roles:

```text
Firebase Hosting
      ↓
Production React Application

Google Gemini API
      ↓
Risk explanations
Crisis briefings
Intervention explanations
Operational Q&A
```

The application does not depend on Google Cloud Run for its current deployment. The production frontend is hosted on Firebase Hosting, while the FastAPI backend runs on Render and PostgreSQL is hosted by Supabase.

---

# API Overview

The backend exposes REST endpoints through FastAPI.

## Health

```http
GET /health
```

Used for deployment health checks.

---

## Inventory

```http
GET /api/inventory/
```

Returns inventory information.

---

## Intelligence

```http
GET /api/intelligence/{facility_code}/{medicine_name}
```

Returns facility, medicine, inventory, forecast, and risk intelligence.

Example:

```text
/api/intelligence/FAC-0001/Paracetamol
```

---

## Crisis Simulation

```http
POST /api/crisis/simulate
```

Simulates the impact of a crisis scenario.

---

## Redistribution

```http
POST /api/crisis/redistribution
```

Generates cross-facility resource redistribution recommendations.

---

## Impact

```http
POST /api/crisis/impact
```

Applies simulated interventions and calculates before-vs-after impact.

---

## Network

The Network module provides facility-level network intelligence and warning information.

Examples include:

```text
/api/network/summary
/api/network/warnings
/api/network/{facility_code}
```

---

## Federated Intelligence

```http
GET /api/federated/summary
```

Returns the current federated-learning simulation summary.

---

# Frontend

The frontend is designed around a command-center style interface.

## Overview

The Overview page combines:

- system health
- network state
- early warnings
- demand intelligence
- crisis simulation
- intervention results

---

## Network

The Network page provides:

- interactive facility map
- risk filtering
- facility search
- facility detail modal
- medicine-level intelligence
- stock coverage
- projected risk

---

## Crisis Lab

The Crisis Lab lets users:

1. choose a scenario
2. modify crisis parameters
3. run the simulation
4. inspect projected failures
5. view redistribution recommendations
6. inspect intervention impact

---

## Resources

The Resources section presents recommended transfers between facilities.

A transfer can contain:

```text
Source facility
        ↓
Medicine
        ↓
Quantity
        ↓
Destination facility
        ↓
Distance
```

---

## Federated Intelligence

The Federated Intelligence page presents:

- training round
- regional nodes
- local accuracy
- global accuracy
- sample counts
- facility counts
- contribution information
- privacy architecture
- aggregation flow

---

# Backend

The backend follows a layered architecture.

```text
Routes
  ↓
Services
  ↓
Database / ML / Optimization
```

### Routes

Routes are responsible for:

- HTTP requests
- validation
- response formatting

### Services

Services contain the core intelligence logic:

```text
risk_engine.py
forecast_service.py
future_risk_engine.py
crisis_simulator.py
bottleneck_detector.py
redistribution_engine.py
optimization_engine.py
intervention_simulator.py
impact_engine.py
```

This separation makes the analytics components easier to test and evolve independently from the API layer.

---

# Database

The PostgreSQL database contains the core healthcare network state.

Main entities include:

```text
Facilities
Medicines
Inventory
```

The medicine catalogue currently contains:

```text
106 medicine SKUs
```

The generated healthcare network contains:

```text
100 facilities
```

and approximately:

```text
7,991 inventory records
```

The database can be hosted locally during development or through Supabase in production.

---

# Local Development

## Prerequisites

Install:

- Python
- Node.js
- npm
- PostgreSQL
- Git

---

# Backend Setup

Move into the backend directory:

```powershell
cd backend
```

Create a virtual environment:

```powershell
python -m venv myenv
```

Activate it on Windows:

```powershell
.\myenv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

---

# Environment Variables

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/resilicare
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Never commit `.env` to Git.

---

# Generate the Database Dataset

Run:

```powershell
python -m scripts.generate_data
```

The generator creates:

```text
100 facilities
106 medicines
inventory records
```

---

# Generate Demand History

Run:

```powershell
python -m scripts.generate_demand_history
```

The development dataset contains:

```text
719,190 records
100 facilities
106 medicines
90 days
```

---

# Train the Forecasting Model

Run:

```powershell
python -m scripts.train_demand_model
```

The trained model is saved as:

```text
data/generated/demand_model.joblib
```

---

# Start the Backend

Run:

```powershell
uvicorn app.main:app --reload
```

The local API is:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

# Frontend Setup

Move into:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the frontend:

```powershell
npm run dev
```

---

# Production Deployment

The current deployment architecture is:

```text
                    GitHub
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
          Vercel               Render
             │                   │
        React App            FastAPI
             │                   │
             └─────────┬─────────┘
                       ↓
                    Supabase
                   PostgreSQL
```

## Frontend

The React application is deployed on Firebase Hosting.

**Live URL:**

```text
https://resilicare-992ca.web.app
```

Production API configuration:

```env
VITE_API_BASE_URL=https://resilicare.onrender.com/api
```

Because Vite embeds environment variables during the build, a deployment should be rebuilt after changing this value.

---

## Backend

The FastAPI backend is deployed on Render.

Build command:

```text
pip install -r requirements.txt
```

Start command:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required environment variables:

```text
DATABASE_URL
GEMINI_API_KEY
```

---

## Database

Production PostgreSQL is hosted through Supabase.

The backend connects through:

```text
DATABASE_URL
```

---

# CORS

The backend allows the deployed frontend origins to communicate with the FastAPI API.

Current production frontend origins:

```text
https://resilicare-992ca.web.app
https://resilicare-992ca.firebaseapp.com
```

The previous Vercel deployment may also be retained as an allowed origin when required:

```text
https://resili-care-iota.vercel.app
```

CORS configuration is required because the frontend and backend are hosted on different domains.

---

# Health Monitoring

The backend exposes:

```http
GET /health
```

This endpoint is suitable for external uptime monitoring.

For example:

```text
https://resilicare.onrender.com/health
```

can be monitored by an uptime service.

---

# Example Crisis Scenario

A severe crisis scenario can be represented as:

```json
{
  "demand_increase_percent": 50,
  "supply_disruption_days": 5,
  "staff_reduction_percent": 10,
  "bed_occupancy_increase_percent": 30
}
```

The platform processes the scenario through:

```text
Scenario
   ↓
Crisis Simulation
   ↓
Risked Inventory Nodes
   ↓
Redistribution Engine
   ↓
Transfer Recommendations
   ↓
Impact Engine
   ↓
Before / After Comparison
```

---

# Demonstration Flow

A complete ResiliCare demonstration can follow this sequence.

### Step 1 — Network

Open the Network page.

Show:

- facilities
- geographic distribution
- risk status
- critical nodes

### Step 2 — Early Warnings

Open the Early Warning Center.

Show:

- critical warnings
- stock-out risk
- safety-stock breaches
- replenishment warnings

### Step 3 — Medicine Intelligence

Select a facility.

Open a medicine.

Show:

- current stock
- consumption
- safety stock
- lead time
- forecast
- projected risk

### Step 4 — Crisis Lab

Select:

```text
Severe Crisis
```

Run:

```text
50% demand increase
5-day supply disruption
10% staff reduction
30% bed occupancy increase
```

### Step 5 — Redistribution

Show:

```text
Source
  ↓
Medicine
  ↓
Quantity
  ↓
Destination
```

### Step 6 — Impact

Compare:

```text
Projected state before intervention
                 vs
Projected state after intervention
```

### Step 7 — Federated Intelligence

Show how regional model updates can be aggregated without directly sharing raw operational records in the simulated architecture.

---

# Design Philosophy

ResiliCare follows a deliberately minimal visual language:

```text
Black
White
Data
```

The interface emphasizes:

- readability
- high information density
- clear hierarchy
- minimal decoration
- interactive analytics
- operational decision support

Risk states use clear semantic indicators:

```text
Healthy
At Risk
Critical
```

---

# Responsible Use

ResiliCare is a **decision-support prototype**.

It is not:

- a clinical diagnosis system
- a replacement for healthcare professionals
- a guaranteed prediction of real-world events
- a substitute for official emergency response systems
- proof of real-world healthcare-system performance

The current implementation relies partly on synthetic operational data.

Forecasts and simulations should therefore be treated as analytical demonstrations until validated using representative real-world data.

Real deployment would require:

- validated data pipelines
- healthcare-system integration
- data governance
- security controls
- privacy protection
- model validation
- monitoring
- human oversight
- domain-expert review
- regulatory and institutional approval where applicable

---

# Data Privacy Concept

ResiliCare's federated-learning concept is intended to reduce the need to centralize raw regional operational data.

Conceptually:

```text
Raw Data
   ↓
Local Training
   ↓
Model Update
   ↓
Secure Aggregation
   ↓
Global Model
```

However, the current federated module is a simulation/prototype and should not be represented as a production-grade privacy-preserving implementation without additional security mechanisms and validation.

---

# Future Roadmap

## Phase 1 — Current Prototype

- [x] Healthcare network visualization
- [x] Medicine inventory intelligence
- [x] Early warning system
- [x] Demand forecasting
- [x] Crisis simulation
- [x] Resource redistribution
- [x] Intervention impact analysis
- [x] Federated intelligence simulation
- [x] Gemini-powered intelligence layer
- [x] Firebase Hosting + Render + Supabase deployment architecture

---

## Phase 2 — Real Healthcare Data Integration

Potential integrations:

```text
HMIS
Hospital Management Systems
Inventory Management Systems
Public Health APIs
Supply Chain Systems
Facility APIs
```

---

## Phase 3 — Real-Time Intelligence

Add:

- streaming inventory updates
- real-time facility telemetry
- event-driven alerts
- automated anomaly detection
- real-time capacity monitoring

---

## Phase 4 — Advanced Forecasting

Potential models:

```text
XGBoost
LightGBM
Temporal Fusion Transformer
LSTM
Probabilistic Forecasting
Time-Series Ensembles
```

Model selection should be based on validation performance and operational requirements rather than model complexity alone.

---

## Phase 5 — Advanced Optimization

Future optimization can include:

- vehicle capacity
- transportation cost
- transfer priority
- medicine expiry
- cold-chain requirements
- warehouse constraints
- facility priority
- multi-hop logistics
- disaster-zone accessibility

---

## Phase 6 — BRICS-Scale Collaboration

The long-term concept can support regional collaboration across BRICS countries.

The architecture could allow:

```text
Country / Region
      ↓
Local Healthcare Model
      ↓
Federated Model Updates
      ↓
Shared Global Intelligence
```

while maintaining appropriate data-governance boundaries.

---

# Why ResiliCare

Traditional healthcare dashboards primarily answer:

> **What is happening?**

ResiliCare attempts to extend this into:

> **What is likely to happen?**

and:

> **What happens if the system is stressed?**

and finally:

> **Which intervention can reduce the projected impact?**

The core product idea can therefore be summarized as:

```text
Observe
   ↓
Predict
   ↓
Stress-Test
   ↓
Optimize
   ↓
Compare
   ↓
Explain
```

---

# Project Status

Current prototype capabilities include:

```text
✅ 100 healthcare facilities
✅ 106 medicine SKUs
✅ ~7,991 inventory records
✅ 90-day demand history generation
✅ 719,190 demand records
✅ Random Forest demand forecasting
✅ 7-day forecasting
✅ Inventory risk intelligence
✅ Early warning center
✅ Crisis simulation
✅ Resource redistribution
✅ Intervention impact analysis
✅ Federated intelligence simulation
✅ Gemini integration
✅ React dashboard
✅ Interactive network map
✅ PostgreSQL / Supabase
✅ FastAPI backend
✅ Firebase Hosting frontend
✅ Render backend
```

Production crisis endpoints have been verified to return successful responses:

```text
POST /api/crisis/simulate       → 200 OK
POST /api/crisis/redistribution → 200 OK
POST /api/crisis/impact         → 200 OK
```

---

# One-Line Pitch

> **ResiliCare is an AI-powered healthcare resilience platform that predicts resource failures, stress-tests healthcare networks, and simulates interventions before shortages become critical.**

---

# Short Pitch

> **ResiliCare transforms healthcare resource management from reactive monitoring into predictive resilience — forecasting demand, detecting early shortages, simulating crises, optimizing cross-facility redistribution, and evaluating interventions before they are deployed.**

---

# Hackathon Pitch

> **Healthcare systems don't fail all at once — they fail through cascading shortages. ResiliCare creates a digital intelligence layer that predicts where those failures may emerge, simulates how a crisis could propagate across facilities, and identifies resource interventions that can reduce projected impact.**

---

# Author

**Mohammed Fahad**

B.E. — Information Science and Engineering

Bengaluru, India

---

# License

This project is currently presented as a prototype / demonstration project.

No open-source license is currently declared. If the repository is intended to be distributed under an open-source license, add a `LICENSE` file and update this section accordingly.
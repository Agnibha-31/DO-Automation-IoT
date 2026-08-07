<div align="center">
  
# DO Automation IoT
</div>

### A full-stack dissolved-oxygen monitoring, visualization, analytics, and data-export dashboard

<p align="center">
  <a href="./LICENSE"><img alt="Code license: Apache 2.0" src="https://img.shields.io/badge/code%20license-Apache--2.0-blue.svg"></a>
  <a href="./LICENSE-MEDIA"><img alt="Dashboard media license: CC BY 4.0" src="https://img.shields.io/badge/media%20license-CC%20BY%204.0-green.svg"></a>
  <img alt="Frontend: React and TypeScript" src="https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-149eca.svg">
  <img alt="Backend: Node.js and Express" src="https://img.shields.io/badge/backend-Node.js%20%2B%20Express-43853d.svg">
  <img alt="Database: PostgreSQL" src="https://img.shields.io/badge/database-PostgreSQL-4169e1.svg">
</p>

<p align="center">
  <strong>Monitor raw and corrected dissolved oxygen, temperature, pressure, and oxygen saturation from one dark industrial dashboard.</strong>
</p>

---

## Important project status

This repository is the **full-stack IoT monitoring dashboard** for the wider DO automation project. It provides the dashboard interface, PostgreSQL-backed API, account and device-key management, browser demonstration mode, live reading storage, analytics views, and data export. It still needs the security and correctness work listed in [Known limitations and production checklist](#known-limitations-and-production-checklist) before it should be used in a production, safety-critical, commercial, or unattended control system.

The documentation below was checked against public commit **8dc3231** on **7 August 2026**.

This repository intentionally covers the **monitoring and dashboard layer**: reading ingestion, storage, visualization, account/device management, calibration-event recording, DAC-setting storage, and export. Device firmware, electronics, relay/actuator control, and the other control-system components belong to separate parts of the wider project.

> **Safety notice:** Never use this dashboard as the only protection for aquaculture, water treatment, laboratory equipment, industrial processes, or life-supporting systems. Validate the sensor, calibration method, units, limits, alarms, network behavior, and independent hardware fail-safes for the intended domain.

---

## Table of contents

- [What this project does](#what-this-project-does)
- [Dashboard scope](#dashboard-scope)
- [Dashboard tour and screenshots](#dashboard-tour-and-screenshots)
- [System architecture](#system-architecture)
- [How data moves through the system](#how-data-moves-through-the-system)
- [Measurements and data dictionary](#measurements-and-data-dictionary)
- [Demo mode and live monitoring](#demo-mode-and-live-monitoring)
- [Analytics and monitoring indicators](#analytics-and-monitoring-indicators)
- [Repository structure](#repository-structure)
- [Quick start: dashboard-only demo](#quick-start-dashboard-only-demo)
- [Full local setup with PostgreSQL](#full-local-setup-with-postgresql)
- [Connect an IoT sensor or data producer](#connect-an-iot-sensor-or-data-producer)
- [API reference](#api-reference)
- [Database design](#database-design)
- [Data download and export](#data-download-and-export)
- [Configuration reference](#configuration-reference)
- [Deployment](#deployment)
- [Customization guide](#customization-guide)
- [Known limitations and production checklist](#known-limitations-and-production-checklist)
- [Testing and validation](#testing-and-validation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Licensing and attribution](#licensing-and-attribution)
- [Citation](#citation)
- [Developer](#developer)

---

## What this project does

DO means **dissolved oxygen**: the amount of oxygen dissolved in water. It is commonly reported in milligrams per litre, written as mg/L. Dissolved oxygen is important in aquaculture, environmental monitoring, wastewater treatment, water-quality research, and many laboratory or industrial processes.

This project gives an operator one place to:

- view the latest raw dissolved-oxygen value;
- view a corrected dissolved-oxygen value supplied by the device or another processing system;
- monitor water temperature, atmospheric or process pressure, and DO saturation;
- inspect recent time-series charts;
- view simple descriptive statistics;
- register users and associate each user with a sensor;
- send readings securely with a device API key;
- store readings in PostgreSQL;
- record zero or span calibration events;
- save a corrected-DO/DAC setting;
- export selected measurements as CSV, JSON, XLSX, or PDF;
- inspect recent export history;
- run the frontend without hardware or a database by using generated demo data; and
- provide a polished visual starting point for a custom water-quality dashboard.

The interface is designed for a wide desktop display. It uses a dark control-room style, a left navigation rail, status cards, interactive charts, parameter pages, account settings, and a device configuration screen.

---

## Dashboard scope

| Area | Included in this repository? | Explanation |
|---|---:|---|
| React dashboard | Yes | Ten main pages, reusable components, charts, authentication screens, responsive UI primitives, and demo mode |
| Node.js API | Yes | Express routes for authentication, readings, sensors, calibration events, DAC settings, and exports |
| PostgreSQL schema | Yes | Tables and indexes are created automatically when the backend starts |
| User authentication | Yes | Password hashing, JWT login, user preferences, password reset token flow, and account deletion |
| Device authentication | Yes | Each sensor receives an API key used in the X-API-Key request header |
| Generated demo readings | Yes | The browser creates realistic-looking time series so the complete interface can be explored without hardware |
| Recorded operational readings | At runtime | Submitted sensor values are stored in PostgreSQL and can be viewed or exported by their owner |
| Microcontroller or sensor firmware | **No** | ESP32, Arduino, Raspberry Pi, PLC, Modbus, and serial-device code are outside this repository |
| Wiring diagram or bill of materials | **No** | Hardware assembly information is not included |
| Automatic actuator control | **No** | No aerator, pump, valve, relay, or dosing loop is commanded by this code |
| Real notification delivery | **No** | Notification switches are interface settings; email, SMS, and push delivery are not implemented |

The dashboard accepts both raw and corrected DO channels from the wider system. Its responsibility is to receive, store, display, summarize, and export the submitted values through a secure user/device workflow.

---

## Dashboard tour and screenshots

All ten repository screenshots are embedded below. GitHub loads them directly from the existing **Dashboard Images** folder. The folder name is misspelled in the repository, so the README intentionally uses that exact spelling. If the folder is renamed later, update every image path in this file.

### 1. Main DO dashboard

The home page combines the latest values for raw DO, corrected DO, temperature, pressure, and saturation. Each metric has a summary card and a recent trend chart. A connection indicator, time, location/weather information, refresh control, and navigation are kept visible around the monitoring area.

![DO Automation IoT main dashboard](./Dahsboard%20Images/DO%20Dashboard%20Page.png)

### 2. Old DO concentration: raw sensor value

“Old DO” is the interface name used for the uncorrected value stored in the **do_concentration** field. This page focuses on the raw measurement, shows its current status, and plots the recent series. The word “old” does not mean an older timestamp; it means the original or pre-correction DO channel.

![Raw or old DO concentration page](./Dahsboard%20Images/Old%20DO%20Concentration%20Page.png)

### 3. New DO concentration: corrected value

“New DO” is the corrected channel stored as **corrected_do**. It is supplied to the dashboard by the upstream sensing and correction part of the wider DO system and is displayed alongside the original reading.

![Corrected or new DO concentration page](./Dahsboard%20Images/New%20DO%20Concentration%20Page.png)

### 4. Temperature

The temperature page isolates the water-temperature series, current value, status, minimum, maximum, average, and recent variation. Temperature is stored in degrees Celsius.

![Temperature monitoring page](./Dahsboard%20Images/Temperature%20Page.png)

### 5. Pressure

The pressure page presents the submitted pressure signal in kilopascals. The application treats this as a monitored input; it does not derive pressure from altitude or weather.

![Pressure monitoring page](./Dahsboard%20Images/Pressure%20Page.png)

### 6. DO saturation

The saturation page shows dissolved-oxygen saturation as a percentage. Values can exceed 100% when water is supersaturated, so the interface supports values above 100 rather than clipping them.

![Dissolved oxygen saturation page](./Dahsboard%20Images/DO%20Saturation%20Page.png)

### 7. Analytics

The analytics page lets the operator select a parameter and time range. It calculates descriptive statistics from the loaded readings and draws a trend, moving average, and variation band. Some advanced cards are interface previews rather than live calculations; see [Analytics and monitoring indicators](#analytics-and-monitoring-indicators).

![DO analytics page](./Dahsboard%20Images/DO%20Analytics%20Page.png)

### 8. Data download

The download page lets a signed-in user choose a date range, measurements, file format, raw-data option, analytics option, and compression. The backend records export metadata so recent downloads can be listed.

![Data download and export page](./Dahsboard%20Images/Data%20Download%20Page.png)

### 9. Settings

The settings page contains profile, language, timezone, location, refresh, visual-quality, notification, security, and retention controls. Some controls persist to the backend, while others currently change only the interface state. The exact distinction is documented later.

![Dashboard settings page](./Dahsboard%20Images/Settings%20Page.png)

### 10. Device configuration

The device page displays the account, sensor identifier, and masked API key. It can reveal, copy, or regenerate the device key, shows storage information, provides a Python request example, and offers permanent account deletion.

![Device configuration page](./Dahsboard%20Images/Device%20Configuration%20Page.png)

---

## System architecture

~~~mermaid
flowchart TD
    A["DO sensor or gateway"] -->|"JSON + X-API-Key"| B["Express API"]
    B --> C["PostgreSQL"]
    C --> B
    D["React dashboard"] -->|"JWT requests"| B
    B -->|"latest, history, stats, exports"| D
    D --> E["Operator"]
~~~

### Technology stack

| Layer | Main technology | Purpose |
|---|---|---|
| User interface | React 18, TypeScript, Vite 6 | Pages, navigation, forms, charts, demo mode, and API calls |
| Components | Radix UI primitives and shadcn/ui-style components | Accessible dialogs, menus, forms, cards, tabs, and layout controls |
| Visualization | Recharts plus a custom SVG trend chart | Time-series plots, metric cards, moving average, and bands |
| Motion and icons | Motion and Lucide React | Transitions, interaction feedback, and icons |
| API | Node.js, Express, Zod | HTTP routes, request validation, authentication, and responses |
| Authentication | bcryptjs and JSON Web Tokens | Password hashing and signed user sessions |
| Storage | PostgreSQL through node-postgres | Users, sensors, readings, calibration events, settings, and export logs |
| Export | csv-stringify, ExcelJS, PDFKit, zlib | CSV, JSON, XLSX, PDF, and optional Gzip output |
| Time and location | Browser geolocation and timezone utilities | Localized display context with a fallback timezone estimate |
| Deployment configuration | Render and Vercel files | Backend/database and frontend deployment templates |

### Two different credentials

The application deliberately separates people from devices:

1. A **user JWT** is created at login. The browser sends it as an Authorization bearer token when reading data, changing preferences, exporting data, or managing the account.
2. A **sensor API key** belongs to one sensor. A device or ingestion program sends it in the X-API-Key header when writing readings, recording calibration, or updating the DAC setting.

Do not place the sensor key in browser source code, commit it to Git, or expose it in screenshots.

---

## How data moves through the system

1. A user registers. The backend hashes the password and creates a default sensor with a unique ID and API key.
2. The user opens Device Configuration and copies the device ID and API key.
3. A sensor, gateway, or device-integration service sends a JSON reading to POST /api/readings with the API key.
4. The backend validates the JSON and associates the reading with the sensor identified by that key.
5. PostgreSQL stores the values and timestamps and updates the sensor’s last-seen time.
6. The dashboard logs in with a JWT and requests the latest value, recent history, and database statistics.
7. The frontend converts the returned values into cards, status labels, and time-series charts.
8. The operator can export a selected date range and selected columns. The backend records the export in export_logs.

### Raw DO and corrected DO

The project uses two DO channels:

| Interface term | API/database field | Meaning |
|---|---|---|
| Old DO concentration | do_concentration | Raw or original DO measurement from the data producer |
| New DO concentration | corrected_do | Corrected or processed DO value supplied by the wider DO system |

This dashboard keeps the original and corrected channels separate so an operator can view and compare both values clearly.

---

## Measurements and data dictionary

### Reading payload

| Field | Type | Unit | Meaning | Database precision |
|---|---|---|---|---|
| do_concentration | Number or null | mg/L | Raw dissolved-oxygen concentration | DECIMAL(10,3) |
| corrected_do | Number or null | mg/L | Externally corrected or processed DO concentration | DECIMAL(10,3) |
| temperature | Number or null | °C | Submitted water/process temperature | DECIMAL(10,2) |
| pressure | Number or null | kPa | Submitted pressure | DECIMAL(10,2) |
| do_saturation | Number or null | % | Dissolved-oxygen saturation | DECIMAL(10,2) |
| timestamp | Number, optional | Unix seconds | Time at which the reading was captured | BIGINT as captured_at |
| metadata | JSON object, optional | — | Extra information supplied by the device | Stored as text |

The current Zod schema makes every measurement optional. For useful records, submit all values available from the device and always use a consistent unit system.

### Display thresholds currently coded in the interface

These ranges control colors and labels in the current UI. They are **display defaults**, not universal scientific, biological, regulatory, or safety limits.

| Parameter | Optimal display range | Warning/display labels | Critical display range |
|---|---|---|---|
| Raw or corrected DO | 8–10 mg/L | 6 to below 8 mg/L, or above 10 mg/L | Below 6 mg/L |
| Temperature | 20–30 °C | 15 to below 20 °C is shown as cool; above 30 to 35 °C is warning | Below 15 °C or above 35 °C |
| Pressure | 99–104 kPa | 95 to below 99 kPa, or above 104 to 107 kPa | Below 95 kPa or above 107 kPa |
| DO saturation | 90–100% | 80 to below 90%, or above 100 to 110% | Below 80% or above 110% |

Before using the dashboard in a real domain:

- define thresholds from the correct species, process, instrument, site, and regulatory requirements;
- account for temperature, salinity, atmospheric pressure, elevation, probe technology, and calibration;
- decide how missing or stale data should appear;
- add hysteresis and delay where rapid switching would be harmful; and
- validate every status against reference measurements.

---

## Demo mode and live monitoring

The project has two operating modes.

### Demo mode

Demo mode runs entirely in the browser. It does not need PostgreSQL, a backend, an account, a sensor, or an internet-connected device.

The generator creates at most 5,000 readings at 120-second intervals. It uses smooth sinusoidal patterns to make temperature, pressure, saturation, corrected DO, and raw DO move in a realistic-looking way. It uses the example sensor ID **DO-KGP-2026-017**.

The following demo statistics are fixed examples for interface presentation:

- 48,240 records;
- 18.6 MB;
- 67 days of history;
- 720 records per day; and
- 90 days of retention.

These figures are illustrative interface values. They do not represent readings received from a connected device.

### Live mode

Live mode uses the Express API and PostgreSQL. Every successful device submission creates a row in the readings table. That database is the repository’s operational recording mechanism.

Users can download their own stored readings through the Data Download page. Operational records remain in the configured PostgreSQL instance unless an authorized user exports or deletes them.

---

## Analytics and monitoring indicators

The analytics page mixes data-driven calculations with fixed interface examples. This section makes the boundary explicit.

### Values calculated from loaded readings

For the selected parameter and available time range, the frontend calculates:

- average;
- minimum;
- maximum;
- range, calculated as maximum minus minimum;
- population standard deviation;
- a simple direction label based on the first and last values;
- a five-point moving average; and
- a visual upper and lower band formed by moving average plus or minus one overall population standard deviation.

These are descriptive statistics. The chart calls the band a confidence band, but it is not a statistically estimated confidence interval and should not be interpreted as one.

### Interface preview indicators

The remaining advanced cards—including quality distribution, relationship coefficients, forward-looking summaries, drift, anomaly, quality, and stability indicators—are currently fixed interface examples. They do not change stored readings and are not used by the live monitoring workflow.

Connect these cards to defined backend calculations before using them as operational indicators or performance claims.

### Time-window note

The parameter pages request 168 history points and label the view as seven days. The live backend interprets the limit as both a point count and a minute-based look-back, while demo readings are two minutes apart. Therefore the current “7 days” and some “24 hours” labels do not always match the actual time coverage. A robust version should accept explicit start/end timestamps or a sampling-aware duration.

---

## Repository structure

~~~text
DO-Automation-IoT/
├── Dashboard Images/              # Ten dashboard screenshots; spelling is intentional
├── backend/
│   ├── src/
│   │   ├── middleware/            # JWT/device authentication and async error wrapper
│   │   ├── routes/                # Auth, readings, sensors, calibration, DAC, and export routes
│   │   ├── services/              # User, sensor, reading, and analytics helpers
│   │   ├── config.js              # Environment configuration
│   │   ├── db-postgres.js         # PostgreSQL pool and automatic schema creation
│   │   └── index.js               # Express application entry point
│   ├── package.json
│   ├── package-lock.json
│   └── render.yaml                # Render web service and PostgreSQL blueprint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/             # Ten main dashboard pages
│   │   │   ├── ui/                # Reusable Radix/shadcn-style UI primitives
│   │   │   └── utils/             # API client, demo data, location, theme, and translations
│   │   ├── services/              # Timezone service
│   │   ├── utils/                 # Database/device/location helpers
│   │   ├── styles/                # Shared styles
│   │   ├── guidelines/            # UI guidelines
│   │   ├── Attributions.md        # Frontend attribution notes
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── dist/                      # Committed Vite output
│   ├── build/                     # Older committed build output
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vercel.json
│   └── vite.config.ts
├── LICENSE                        # Apache License 2.0 for project software
├── LICENSE-MEDIA                   # Creative Commons Attribution 4.0 legal code
├── NOTICE                         # Copyright, license scope, and third-party notice
└── README.md
~~~

### Backend file map

| File | Responsibility |
|---|---|
| backend/src/index.js | Configures CORS, JSON parsing, logging, health route, API routers, error handling, database startup, and graceful shutdown |
| backend/src/config.js | Reads server, CORS, JWT, database, default-device, and backend URL environment variables |
| backend/src/db-postgres.js | Creates the PostgreSQL pool, tables, foreign keys, and indexes |
| backend/src/middleware/auth.js | Verifies user bearer tokens and device API keys |
| backend/src/middleware/asyncHandler.js | Passes rejected async route errors to Express |
| backend/src/routes/auth.js | Registration, login, profile, preferences, password operations, device credentials, and account deletion |
| backend/src/routes/readings.js | Device ingestion plus user-facing latest, history, statistics, and storage endpoints |
| backend/src/routes/sensors.js | Lists a user’s sensors and regenerates a sensor key |
| backend/src/routes/calibrate.js | Records zero or span calibration events |
| backend/src/routes/dac.js | Inserts or updates the sensor’s corrected-DO/DAC setting |
| backend/src/routes/export.js | Builds CSV, JSON, XLSX, and PDF exports and records export history |
| backend/src/services/authService.js | Password hashing, JWT creation, users, profiles, and reset tokens |
| backend/src/services/sensorService.js | Sensor creation, ownership lookup, last-seen update, and key regeneration |
| backend/src/services/readingService.js | Reading insertion, latest/range queries, deletion helper, and counts |
| backend/src/services/analyticsService.js | Descriptive statistics and time-bucket helpers; currently not wired to a dedicated route |

The package script **npm run seed** points to backend/src/scripts/seed-demo.js, but that file is not present in the audited repository. Use frontend demo mode instead until a seed script is added.

### Frontend file map

| Area | Important files | Responsibility |
|---|---|---|
| Application entry | App.tsx, main.tsx | Authentication state, demo bypass, theme, transitions, and root rendering |
| Shell | Dashboard.tsx, Header.tsx, Sidebar.tsx | Page selection and shared dashboard chrome |
| Authentication | LoginPage.tsx, RegisterPage.tsx, AnimatedInput.tsx | Login, registration, forgot/reset password, and animated form controls |
| Main pages | HomePage.tsx, OldDOPage.tsx, NewDOPage.tsx, TemperaturePage.tsx, PressurePage.tsx, DOSaturationPage.tsx, AnalyticsPage.tsx, DataDownloadPage.tsx, SettingsPage.tsx, DeviceConfigPage.tsx | All visible dashboard screens |
| Charts | TrendAnalysisChart.tsx, IndustrialChart.tsx, IndustrialGauge.tsx, MultiParameterChart.tsx | Custom trend rendering and reusable visual components; not every component is currently mounted |
| API/demo | components/utils/backend.ts, components/utils/demoData.ts | JWT persistence, API calls, export downloads, and browser-generated demo records |
| Localization | translations.ts, countries.ts, timezones.ts | Interface dictionaries and selector data |
| Location | components/utils/locationService.ts, utils/locationService.ts, services/timezoneService.ts | Browser location, reverse lookup/weather attempts, and timezone fallback |
| Theme | themeContext.tsx, index.css, styles/globals.css | Dark interface theme, chart quality, and styles |
| Device/database helpers | utils/deviceService.ts, utils/databaseService.ts | Device configuration and storage API access |
| UI primitives | components/ui/*.tsx | Accordion, alert, dialog, form, input, menu, table, tabs, tooltip, and other reusable controls |
| Supporting files | Attributions.md, guidelines/Guidelines.md, figma/ImageWithFallback.tsx | Attribution, design guidance, and image fallback behavior |

The committed **dist** and **build** directories are generated assets, not the best place to edit the application. Make changes in frontend/src and rebuild. Keeping two compiled output directories can cause confusion; maintainers should choose one deployment artifact or let the hosting platform build from source.

---

## Quick start: dashboard-only demo

This is the fastest way to explore every page. No PostgreSQL database or sensor is required.

### Requirements

- Git
- Node.js 20 or newer recommended
- npm

### Run

~~~bash
git clone https://github.com/Agnibha-31/DO-Automation-IoT.git
cd DO-Automation-IoT/frontend

# See the cross-platform dependency note below.
npm install --force
npm run dev -- --host
~~~

Open:

~~~text
http://localhost:3000/?demo=1
~~~

The query parameter activates demo mode and bypasses login. It does not write data to the backend.

### Current cross-platform dependency note

The frontend package directly declares the Windows-only package **@rollup/rollup-win32-x64-msvc**. A strict **npm ci** therefore fails on Linux. The audited build succeeded on Linux with **npm install --force**, but this is a workaround.

The maintainable fix is to remove the platform-specific direct dependency from frontend/package.json, regenerate the lock file on a supported development platform, and let Vite/Rollup install the correct optional native package for each operating system. After that correction, use **npm ci** for reproducible installs.

### Enable demo mode through an environment file

Instead of adding ?demo=1 to the URL, create frontend/.env.local:

~~~dotenv
VITE_DEMO_MODE=true
~~~

Restart the Vite server after changing an environment file.

---

## Full local setup with PostgreSQL

Use this path when you want real user accounts, sensor ingestion, database storage, and exports.

### 1. Install requirements

- Node.js 20 or newer recommended
- npm
- PostgreSQL 14 or newer
- Git

### 2. Clone the project

~~~bash
git clone https://github.com/Agnibha-31/DO-Automation-IoT.git
cd DO-Automation-IoT
~~~

### 3. Create a PostgreSQL database

One simple local example is:

~~~sql
CREATE USER do_dashboard_user WITH PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE do_dashboard OWNER do_dashboard_user;
~~~

Use your operating system’s PostgreSQL tools or a managed PostgreSQL service. Do not commit the real password.

### 4. Configure the backend

Create backend/.env:

~~~dotenv
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://do_dashboard_user:replace-with-a-strong-password@localhost:5432/do_dashboard
JWT_SECRET=replace-with-at-least-32-random-bytes
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:3000
BACKEND_URL=http://localhost:5000

# These are fallbacks only. Registered users receive their own sensor and key.
DEVICE_ID=sensor-001
DEVICE_API_KEY=replace-this-device-key
~~~

Generate a new, unpredictable JWT secret. The fallback values in source code are development conveniences and are unsafe for a public deployment.

### 5. Start the backend

~~~bash
cd backend
npm install
npm run dev
~~~

At startup, the backend connects to PostgreSQL and creates the required tables and indexes if they do not exist.

Check the health endpoint:

~~~text
http://localhost:5000/api/health
~~~

A healthy response has this shape:

~~~json
{
  "ok": true,
  "time": 1786123456789
}
~~~

### 6. Configure the frontend

In a second terminal, create frontend/.env.local:

~~~dotenv
VITE_API_BASE=http://localhost:5000
VITE_DEMO_MODE=false
~~~

The API client requests paths beginning with /api, so the base should normally be the server origin shown above.

### 7. Start the frontend

~~~bash
cd frontend
npm install --force
npm run dev
~~~

Open http://localhost:3000.

### 8. Register and obtain a device key

1. Create an account with a name, valid email address, and password of at least eight characters.
2. Log in.
3. Select the user card/device configuration area in the dashboard.
4. Reveal and copy the sensor ID and API key.
5. Store the key in the device’s secret configuration, never in public source code.
6. Send a test reading using one of the examples below.

---

## Connect an IoT sensor or data producer

Any device or program that can make an HTTPS POST request can submit data. This can be a microcontroller gateway, Raspberry Pi, laboratory computer, edge application, or PLC integration service.

### cURL example

Replace the URL and key with your own values:

~~~bash
curl --request POST http://localhost:5000/api/readings \
  --header "Content-Type: application/json" \
  --header "X-API-Key: YOUR_SENSOR_API_KEY" \
  --data '{
    "do_concentration": 7.842,
    "corrected_do": 8.031,
    "temperature": 25.64,
    "pressure": 101.32,
    "do_saturation": 96.48,
    "timestamp": 1786123456,
    "metadata": {
      "source": "laboratory-gateway",
      "firmware": "1.0.0"
    }
  }'
~~~

### Python example

~~~python
import time
import requests

API_URL = "http://localhost:5000/api/readings"
DEVICE_API_KEY = "YOUR_SENSOR_API_KEY"

reading = {
    "do_concentration": 7.842,
    "corrected_do": 8.031,
    "temperature": 25.64,
    "pressure": 101.32,
    "do_saturation": 96.48,
    "timestamp": int(time.time()),
    "metadata": {
        "source": "python-example"
    }
}

response = requests.post(
    API_URL,
    headers={
        "Content-Type": "application/json",
        "X-API-Key": DEVICE_API_KEY
    },
    json=reading,
    timeout=15
)
response.raise_for_status()
print(response.json())
~~~

Install the Python HTTP package if needed:

~~~bash
python -m pip install requests
~~~

### Recommended device behavior

- Use HTTPS outside a trusted local network.
- Store the API key in a secret store or protected device configuration.
- Send Unix timestamps in **seconds**, not milliseconds.
- Queue readings during a temporary network failure and retry with backoff.
- Include a stable firmware or gateway version in metadata.
- Validate units before transmission.
- Do not send empty measurement objects.
- Decide how duplicate submissions will be handled; the current database has no deduplication key.
- Rotate the sensor key immediately if it is exposed.

### Record a calibration event

~~~bash
curl --request POST http://localhost:5000/api/calibrate \
  --header "Content-Type: application/json" \
  --header "X-API-Key: YOUR_SENSOR_API_KEY" \
  --data '{"mode":"span","value":8.250}'
~~~

Supported modes are **zero** and **span**. This route records the event. It does not communicate with a physical probe or perform a complete calibration procedure.

### Store a corrected-DO/DAC setting

~~~bash
curl --request POST http://localhost:5000/api/dac \
  --header "Content-Type: application/json" \
  --header "X-API-Key: YOUR_SENSOR_API_KEY" \
  --data '{"corrected_do":8.031}'
~~~

This stores one value in PostgreSQL. It does not generate an electrical DAC signal or send a command to hardware.

---

## API reference

All paths below are relative to the backend origin.

### Authentication legend

| Label | Required header |
|---|---|
| Public | None |
| User | Authorization: Bearer USER_JWT |
| Device | X-API-Key: SENSOR_API_KEY |

### Health and authentication

| Method | Path | Access | Purpose |
|---|---|---:|---|
| GET | /api/health | Public | Backend health and server time |
| GET | /api/auth/check-first-user | Public | Reports whether the users table is empty |
| POST | /api/auth/check-email | Public | Checks whether an email is already registered |
| POST | /api/auth/register | Public | Creates a user and default sensor |
| POST | /api/auth/login | Public | Verifies credentials and returns a JWT |
| GET | /api/auth/me | User | Returns the current user |
| PATCH | /api/auth/preferences | User | Updates name, timezone, language, or country |
| POST | /api/auth/change-password | User | Changes password after checking the current password |
| POST | /api/auth/forgot-password | Public | Generates a 15-minute reset token |
| POST | /api/auth/reset-password | Public | Sets a new password with email and reset token |
| GET | /api/auth/device-config | User | Returns account and device credentials |
| DELETE | /api/auth/delete-account | User | Permanently deletes the user and associated data |

### Sensor and readings

| Method | Path | Access | Purpose |
|---|---|---:|---|
| POST | /api/readings | Device | Inserts one reading |
| GET | /api/readings/latest | User | Returns the most recent reading for the selected/default user sensor |
| GET | /api/readings/history?limit=500 | User | Returns recent points |
| GET | /api/readings/stats | User | Returns count and earliest/latest timestamps for one sensor |
| GET | /api/readings/storage-info | User | Returns total user readings and a rough size estimate |
| GET | /api/sensors | User | Lists sensors owned by the user |
| POST | /api/sensors/:sensorId/regenerate-key | User | Replaces the device API key |
| POST | /api/calibrate | Device | Records a zero or span calibration event |
| POST | /api/dac | Device | Inserts or updates a corrected-DO/DAC setting |

The latest, history, and statistics endpoints accept an optional **sensor_id** query parameter. Ownership is checked before data is returned.

### Export

| Method | Path | Access | Purpose |
|---|---|---:|---|
| GET | /api/export/readings | User | Downloads selected readings |
| GET | /api/export/stats | User | Returns storage and coverage statistics for all of the user’s sensors |
| GET | /api/export/logs | User | Returns the latest 50 export-log records |

### Common response codes

| Code | Meaning |
|---:|---|
| 200 | Request completed |
| 201 | User or reading created |
| 400 | Invalid input or expired reset token |
| 401 | Missing or invalid user authentication |
| 403 | Invalid device key or denied sensor access |
| 404 | User or sensor not found |
| 409 | Email already registered |
| 500 | Unhandled server or database error |

Zod validation errors currently reach the general error handler and may be returned as HTTP 500 rather than a cleaner 400 response. This should be corrected before exposing the API broadly.

---

## Database design

The backend creates six tables.

~~~mermaid
erDiagram
    USERS ||--o{ SENSORS : owns
    USERS ||--o{ EXPORT_LOGS : creates
    SENSORS ||--o{ READINGS : records
    SENSORS ||--o{ CALIBRATION_EVENTS : has
    SENSORS ||--o| DAC_SETTINGS : has
~~~

| Table | Important contents |
|---|---|
| users | ID, email, name, password hash, reset token/expiry, role, timezone, language, country, timestamps |
| sensors | Sensor ID, owning user, name, API key, sensor type, location, timestamps, last seen |
| readings | Sensor, capture time, five measurement fields, metadata, creation time |
| calibration_events | Sensor, zero/span mode, optional value, event time |
| dac_settings | One corrected-DO setting per sensor and update time |
| export_logs | User, filename, size, format, range, selected metrics, options, and creation time |

Foreign keys use cascading deletion for users and sensors. The backend also creates indexes for sensor/time queries, sensor ownership, and case-insensitive email lookup.

### Time convention

Most backend timestamps use Unix epoch **seconds**. The frontend often converts them to JavaScript milliseconds when creating Date objects. Keep this boundary consistent when adding new code.

### Schema management

The schema is created with CREATE TABLE IF NOT EXISTS and a small number of ALTER TABLE IF NOT EXISTS statements. This is convenient for a prototype but is not a full migration system. For a production project, introduce versioned migrations and test both clean installs and upgrades.

---

## Data download and export

### Selectable measurements

- Raw DO concentration
- Corrected DO concentration
- Temperature
- Pressure
- DO saturation

### Supported live-backend formats

| Format | Output behavior |
|---|---|
| CSV | Human-readable timestamp and selected metric columns |
| JSON | Metadata, selected metric names, data array, and optional analytics object |
| XLSX | Data worksheet and, when available, an Analytics worksheet |
| PDF | Summary header and at most the first 200 raw rows |
| Gzip | Optional compression applied to any generated file |

The default export range is the previous seven days. Start and end can be ISO dates/times, Unix seconds, or Unix milliseconds. If start is later than end, the backend swaps them.

### Query parameters for /api/export/readings

| Parameter | Example | Meaning |
|---|---|---|
| format | csv, json, xlsx, pdf | Output file type |
| metrics | corrected_do,temperature | Comma-separated field names |
| start | 2026-08-01T00:00:00Z | Range start |
| end | 2026-08-07T23:59:59Z | Range end |
| includeRaw | true or false | Include row-level records |
| includeAnalytics | true or false | Request the summary section |
| includeCharts | true or false | Accepted by the frontend but not implemented by the backend |
| compression | true or false | Gzip the generated file |
| sensor_id | sensor UUID | Select an owned sensor |

Example authenticated export:

~~~bash
curl --get http://localhost:5000/api/export/readings \
  --header "Authorization: Bearer YOUR_USER_JWT" \
  --data-urlencode "format=csv" \
  --data-urlencode "metrics=do_concentration,corrected_do,temperature" \
  --data-urlencode "includeRaw=true" \
  --data-urlencode "includeAnalytics=false" \
  --output do-readings.csv
~~~

### Current export limitations

- The backend’s analytics builder looks up internal field names after the tabular records have already been converted to human-readable column names. As a result, requested analytics summaries can be empty.
- includeCharts is passed by the UI but ignored by the backend; exported files do not contain charts.
- Demo mode produces JSON only when JSON is selected. Other demo selections are generated as CSV content, even if the interface uses another filename extension.
- PDF includes only the first 200 raw rows as a preview.
- The storage indicator estimates approximately 1 KB per reading rather than asking PostgreSQL for the real table size.

Fix and test these behaviors before promising complete analytical reports.

---

## Configuration reference

### Backend variables

| Variable | Required? | Default | Purpose |
|---|---:|---|---|
| DATABASE_URL | Yes for startup | None | PostgreSQL connection string |
| NODE_ENV | Recommended | Development behavior | Enables production SSL/CORS defaults when set to production |
| PORT or BACKEND_PORT | No | 5000 | HTTP server port |
| JWT_SECRET | Required for secure deployment | Insecure development fallback | Signs user JWTs |
| JWT_EXPIRY | No | 12h | JWT lifetime |
| CORS_ORIGIN | Required for controlled deployment | * in development | Allowed frontend origin |
| DEVICE_ID | No | sensor-001 | Fallback sensor identifier |
| DEVICE_API_KEY | Required if fallback is used | Insecure placeholder | Fallback device key |
| BACKEND_URL | No | Local URL or configured Render URL | Backend reference URL |

### Frontend variables

| Variable | Required? | Meaning |
|---|---:|---|
| VITE_API_BASE | Yes for a custom backend | Backend origin used by the browser |
| VITE_DEMO_MODE | No | Set to true to bypass authentication and generate browser demo data |

All VITE-prefixed values are embedded into the public browser bundle. Never put private keys, database passwords, JWT secrets, or sensor API keys in a VITE variable.

### Browser storage

The frontend stores the current JWT in localStorage under **do_sensor_token**. This is convenient but increases the impact of a cross-site-scripting vulnerability. A hardened deployment should evaluate secure, HttpOnly, SameSite cookies and add a strict Content Security Policy.

### Settings behavior

| Setting | Current behavior |
|---|---|
| Name, timezone, language, country | Can be sent to the backend preferences route |
| Refresh interval and chart quality | Used by frontend state |
| Dark theme | The UI is effectively locked to the dark presentation |
| GPS, location, and weather | Uses browser/location services with fallback behavior |
| Notification switches | UI state only; no email/SMS/push service |
| Password change shown in Settings | Simulated in that page; the backend has a real change-password route but the page does not call it |
| Retention controls | Simulated; no scheduled deletion worker is implemented |
| Delete account in Device Configuration | Real destructive backend operation after confirmation |

### Languages represented in the UI

The settings list includes English, Bengali, Hindi, Spanish, French, German, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Italian, and Dutch. Review translation completeness and layout direction before describing every language as production-ready.

---

## Deployment

The repository includes:

- backend/render.yaml for a Render Node service and PostgreSQL database; and
- frontend/vercel.json for a Vercel Vite build and single-page application rewrite.

### Render backend

1. Create a Render Blueprint from the repository.
2. Confirm the backend root directory is set correctly if Render does not infer it.
3. Attach the PostgreSQL DATABASE_URL to the web service.
4. replace every placeholder device value;
5. generate a strong JWT secret;
6. set CORS_ORIGIN to the exact HTTPS frontend origin; and
7. check /api/health after deployment.

The current render.yaml uses **npm ci**. Backend installation is cross-platform, but keep the lock file updated and run security review before deployment.

### Vercel frontend

1. import the repository;
2. set the root directory to frontend;
3. set VITE_API_BASE to the deployed backend origin;
4. leave VITE_DEMO_MODE unset or false for live operation;
5. build with npm run build; and
6. test direct navigation and authentication after deployment.

The repository contains configured service URLs, but during the 7 August 2026 audit the configured Vercel deployment returned a deployment-not-found response and the configured backend health endpoint could not be verified. Treat the local demo as the reliable demonstration path until deployment is restored and checked.

### Location and timezone service warning

The latest TypeScript source replaces two external location/timezone request URLs with masked placeholders, so those remote calls fail and the code uses its rough longitude-based timezone fallback. Older compiled JavaScript in the committed **frontend/dist** and **frontend/build** directories still contains a previously embedded third-party browser API credential.

Before any public deployment:

1. revoke or rotate that credential in its provider console;
2. remove it from current generated bundles;
3. consider rewriting Git history if the provider and project policy require it;
4. rebuild from clean source;
5. commit only verified output, or stop committing build output; and
6. use a server-side proxy or properly origin-restricted public browser key when an external API is needed.

Changing only the TypeScript source does not remove a credential from already committed bundles or Git history.

---

## Customization guide

### Use another sensor

The API is not tied to a particular transport protocol. Convert the device output into the JSON reading fields and submit it through an HTTPS-capable gateway. If the instrument uses Modbus/RS-485, serial, MQTT, OPC-UA, or another protocol, add a bridge that reads the instrument and calls this API.

The default sensor_type text is **RS-LDO-N01**, but the backend does not verify the connected instrument type. Update sensor metadata and document the instrument actually used.

### Use another domain

To adapt the project to aquaculture, rivers, wastewater, drinking water, a laboratory, or an industrial process:

1. rename labels for the audience;
2. replace display thresholds with domain-approved ranges;
3. add site, depth, salinity, pH, conductivity, flow, or other required fields;
4. update the PostgreSQL schema through migrations;
5. update ingestion validation and export mapping;
6. add quality flags and sensor-calibration metadata;
7. update charts and units;
8. document sampling frequency and timezone;
9. validate against reference measurements; and
10. add independent alarms and fail-safes where consequences are serious.

### Add real alerts

A real alert system needs more than a switch:

- threshold rules per sensor and domain;
- stale-data and offline-device rules;
- hysteresis, persistence, and cooldown;
- alert-event storage;
- recipient verification;
- email, SMS, webhook, or push integration;
- acknowledgement and escalation;
- delivery retries and audit logs; and
- tests for false positives and missed alerts.

### Add retention

The backend already exports and can delete an account, and readingService contains a delete-before helper. It does not schedule retention. Add a background job, record the policy per user or deployment, test backup behavior, and make deletions auditable.

---

## Known limitations and production checklist

The following findings are based on the audited code. They are included so contributors and users know what remains.

### Release-blocking security work

- **Revoke the exposed third-party browser API credential.** It remains in committed compiled bundles and Git history even though the latest source masks the URL.
- **Remove secret logging.** Sensor key regeneration currently prints old and new full API keys to server logs and logs the returned key at the route layer.
- Replace fallback JWT and device secrets with strong environment values.
- Add rate limiting to login, registration, password-reset, ingestion, and key-regeneration routes.
- Add security headers, for example with Helmet, and define a Content Security Policy.
- Restrict CORS to trusted HTTPS origins.
- Validate and normalize all timestamps and numerical ranges.
- Do not return password-reset tokens directly from a public production API; send a single-use link through a verified delivery channel.
- Review localStorage JWT handling and session revocation.
- Redact secrets and personal information from logs, errors, analytics, and support screenshots.
- Run dependency audit, update vulnerable packages, and review breaking changes before deployment.

### Correctness and completeness work

- Correct the export analytics field-name mismatch.
- Implement or remove the includeCharts export option.
- Make demo exports honor XLSX and PDF selections, or clearly disable unsupported choices.
- Replace point-count/minute assumptions with explicit time-range queries.
- Correct labels that promise seven days or 24 hours when the loaded data covers less time.
- Use Unix seconds consistently in device-config sensor creation and multiply stored user seconds by 1,000 before constructing a JavaScript Date.
- Connect frontend calibration and DAC calls to X-API-Key authentication; the current helper sends the user JWT, while those backend routes require a device key.
- Connect the Settings password form to the real change-password route.
- Implement notification and retention behavior or label those controls as previews.
- Add the missing backend seed-demo.js file or remove the npm seed script.
- Remove the Windows-only direct Rollup dependency and regenerate the frontend lock file.
- Decide whether dist or build is authoritative; avoid keeping stale generated bundles.
- Replace ad-hoc schema creation with versioned migrations.
- Map Zod validation failures to a 400 response.
- Add duplicate-reading handling or an idempotency key.
- Store metadata as PostgreSQL JSONB if it will be queried.

### Monitoring and interpretation work

- Replace fixed analytics cards with traceable calculations.
- Define “data quality,” “stability,” “anomaly,” and “confidence” before presenting those values to operators.
- Preserve raw and corrected DO values as separate fields throughout ingestion, storage, display, and export.
- Document calibration, probe specifications, salinity, elevation, pressure source, and reference methods.

### Engineering quality work

- Add frontend and backend automated tests.
- Add linting, formatting, and type-check commands.
- Add continuous integration for Linux installation, build, tests, and secret scanning.
- Add .env.example files containing placeholders only.
- Add a .gitignore that excludes node_modules, local environment files, logs, coverage, and temporary files.
- Add API integration tests with a temporary PostgreSQL database.
- Add backup, restore, migration, monitoring, and incident procedures.

### Dependency status

The August 2026 audit found high-severity advisory groups in both npm dependency trees. Advisory results change over time. Run the following in each package directory, read every advisory, update dependencies deliberately, rebuild, and retest:

~~~bash
npm audit
npm outdated
~~~

Do not apply npm audit fix --force blindly to a production branch because it can introduce incompatible major versions.

---

## Testing and validation

### Checks completed during the documentation audit

- all tracked files were inventoried;
- all ten PNG screenshots were opened and visually inspected;
- all backend JavaScript files passed Node syntax checking;
- backend dependencies installed from the lock file;
- the frontend production build completed on Linux after the documented forced-install workaround;
- screenshot raw URLs returned image/png content;
- API routes, authentication requirements, database tables, demo generator, analytics calculations, and export behavior were traced in source.

### Not present in the repository

- unit tests;
- integration tests;
- end-to-end browser tests;
- load tests;
- hardware-in-the-loop tests; and
- a continuous-integration workflow.

### Minimum validation for a contribution

1. Start a clean PostgreSQL database.
2. Register a user and log in.
3. obtain a sensor key;
4. submit complete and partial readings;
5. verify sensor ownership isolation with a second user;
6. verify latest and history ordering;
7. export every format and open each file;
8. test key rotation and confirm the old key stops working;
9. test account deletion on related records;
10. build the frontend on Linux, macOS, and Windows;
11. scan bundles and Git history for credentials; and
12. compare dashboard values with database values and a trusted reference calculation.

---

## Troubleshooting

### DATABASE_URL is not configured

The backend cannot start without PostgreSQL. Create backend/.env, add a valid DATABASE_URL, and confirm the database is reachable.

### Browser shows a network error

Check:

- the backend is running;
- VITE_API_BASE points to the backend origin;
- the URL uses the correct HTTP/HTTPS scheme;
- CORS_ORIGIN exactly matches the frontend origin;
- the browser is not blocking mixed HTTP content; and
- /api/health responds.

### Dashboard opens at the login screen when only a visual demo is wanted

Open the URL with ?demo=1 or set VITE_DEMO_MODE=true and restart Vite.

### Linux install fails with an unsupported Rollup package

See [Current cross-platform dependency note](#current-cross-platform-dependency-note). The repository currently declares a Windows-only Rollup package directly. Use the documented temporary workaround or correct the manifest and lock file.

### Device receives 401 Missing x-api-key header

Add X-API-Key to the request. A user bearer token does not replace the device key for ingestion, calibration, or DAC routes.

### Device receives 403 Invalid device key

Copy the active key from Device Configuration. If the key was regenerated, the previous key becomes invalid immediately.

### Dashboard receives 401 Unauthorized

Log in again. The JWT may be missing, expired, signed with a different secret, or associated with a deleted user.

### Charts are empty

- confirm readings were submitted with timestamps in seconds;
- verify the correct sensor belongs to the current user;
- inspect /api/readings/latest and /api/readings/history;
- check that measurement fields are numbers rather than numeric strings; and
- remember that the history endpoint uses a limited recent window.

### Export analytics are missing

This is a known mapping defect in the current export implementation. Raw data can still export; correct buildAnalytics before relying on the summary sheet or section.

### Location or timezone is approximate

The latest source has masked external service URLs and falls back to estimating timezone from longitude. Replace the service integration with a secure, documented provider or keep location fully local.

---

## Contributing

Contributions are welcome for bug fixes, tests, documentation, accessibility, security hardening, sensor integrations, export correctness, migrations, and real evidence-backed analytics.

Suggested workflow:

1. open an issue describing the problem or proposed feature;
2. fork the repository;
3. create a focused branch;
4. do not commit credentials, real user data, node_modules, or unreviewed generated bundles;
5. add or update tests;
6. run the build and relevant checks;
7. update this README when behavior changes; and
8. open a pull request explaining the change, test evidence, and any migration or security effect.

By intentionally submitting a contribution for inclusion, you agree that it is licensed under the project’s Apache-2.0 software license unless clearly stated otherwise and accepted by the maintainer.

For security-sensitive findings, do not post active credentials or private data in a public issue. Contact the maintainer through the GitHub profile first and coordinate a safe disclosure path.

---

## Licensing and attribution

This repository uses a split license so the software and project-authored dashboard media have clear reuse terms.

| Material | License | File |
|---|---|---|
| Project-owned source code, configuration, documentation source, and project build artifacts | Apache License 2.0 | [LICENSE](./LICENSE) |
| Project-authored dashboard screenshots, subject to third-party component rights | Creative Commons Attribution 4.0 International | [LICENSE-MEDIA](./LICENSE-MEDIA) |
| Copyright and scope statement | Project notice | [NOTICE](./NOTICE) |
| Third-party frontend components and assets | Their respective licenses | [frontend/src/Attributions.md](./frontend/src/Attributions.md), package manifests, and lock files |

Important limits:

- The CC BY 4.0 license referenced here applies to the project-authored dashboard screenshots. It does not automatically apply to live database contents, customer records, user information, API keys, secrets, or third-party material.
- A dependency is not relicensed simply because it is used by this project.
- Trademarks and institutional names are not granted by either license.
- Check provenance and permission before publishing recorded environmental or operational data.

Suggested attribution for a project-authored screenshot:

~~~text
DO Automation IoT material by Agnibha Basak, licensed under CC BY 4.0.
Source: https://github.com/Agnibha-31/DO-Automation-IoT
Changes: [describe changes, or state "none"].
~~~

The license files are provided to make reuse clearer, not as legal advice. Obtain qualified advice when licensing obligations, confidential data, institutional ownership, patents, or commercial deployment require it.

---

## Citation

If this repository supports academic or technical work, cite the exact commit or release used.

~~~bibtex
@software{basak_do_automation_iot_2026,
  author  = {Agnibha Basak},
  title   = {DO Automation IoT: Dissolved-Oxygen Monitoring and Data Dashboard},
  year    = {2026},
  url     = {https://github.com/Agnibha-31/DO-Automation-IoT},
  note    = {Software repository; cite the exact release or commit used}
}
~~~

For a formal release, add a version tag and archive it with a service that provides a DOI, then replace or supplement the URL with that DOI.

---

## Developer

### [Agnibha Basak](https://github.com/Agnibha-31)

For IoT dashboards, real-time systems, automations, custom business platforms, deployment support, or a tailored version of this ecosystem, mail at: [remix.play31@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=remix.play31@gmail.com&su=Smart%20Meter%20IoT%20Dashboard%20Enquiry)

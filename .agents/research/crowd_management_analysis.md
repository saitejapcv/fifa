# Crowd Management & Operational Intelligence Research

Research date: 2026-07-07

## 1. Crowd Management Technologies

| Technology / platform type | Sensors and data sources | Density / flow method | Real-time alerting | Relevant case-study signals |
|---|---|---|---|---|
| Computer-vision video analytics, e.g. BriefCam-style video synopsis and AI video surveillance | Existing CCTV, fixed cameras, video-management systems, object/person detection models | Detects and tracks people/objects in camera views; estimates density by zone; can identify counter-flow, abandoned objects, falls, and abnormal crowd movement | Rule-based and ML alerts for congestion, abnormal movement, objects left behind, perimeter violations, and post-incident search | Paris 2024 tested algorithmic video surveillance across hundreds of cameras for events including crowd movement, abandoned objects, and falls; Boston Marathon bombing investigations are often cited for video-synopsis/post-event review use. |
| 3D people-counting sensors, e.g. Xovis-style overhead depth sensors | 3D stereo/depth sensors, infrared/depth maps, edge processing at gates, concourses, restrooms, and concession entries | Counts people crossing virtual lines; measures occupancy, throughput, queue length, dwell time, and directional flow with privacy-preserving depth silhouettes | Alerts when occupancy exceeds thresholds, queue wait time rises, or directional imbalance appears at gates/escalators | Widely used in airports and transport hubs; pattern transfers well to stadium entries, concourse pinch points, and restroom queues where camera privacy is sensitive. |
| Mobile/location analytics, e.g. Crowd Connected-style app SDKs and Bluetooth/GPS systems | Opt-in mobile app telemetry, Bluetooth beacons, GPS, Wi-Fi/BLE gateways, app session events | Builds heatmaps, dwell zones, route choice, crowd movement trajectories, and journey times from consented devices | Alerts on sudden dwell increases, route blockages, abnormal dispersal, and overcrowded points of interest | Used at large festivals and venues such as Coachella/BST Hyde Park according to public profiles; relevant for FIFA fan zones where mobile app opt-in can augment fixed sensors. |
| Passive Wi-Fi sensing and network analytics | Wi-Fi probe requests, access-point association counts, RSSI triangulation, device movement between zones | Estimates device density and movement patterns; clustering can reveal temporal and spatial crowd behavior | Alerts on density growth, anomalous dwell, queue formation, and unusual zone-to-zone movements | Academic studies show passive Wi-Fi can monitor large social-event movement with lower infrastructure cost than dense camera coverage, subject to privacy and device-randomization limits. |
| Ticketing, turnstile, and access-control analytics | Ticket scans, turnstile counts, access-control gates, credential scans, denied-entry events | Measures entry throughput, arrival curves, no-show rates, gate imbalance, and stuck queues | Alerts on slow gates, high rejection rates, fraud clusters, and arrival surges | UEFA Champions League Final 2022 failures show why ticket validation, perimeter design, and command-center visibility must be integrated instead of treated as isolated systems. |

## 2. Key Metrics & Thresholds

Public sources do not provide one universal global stadium threshold set. The values below are practical planning bands drawn from crowd-safety literature, pedestrian-flow research, and common venue operations practice; venue safety officers must validate final thresholds against local codes and stadium geometry.

| Metric | Green | Amber | Red | Product use |
|---|---:|---:|---:|---|
| Static crowd density | 0-2 persons/m2 | 3-4 persons/m2 | 5+ persons/m2 | At 5 persons/m2, movement becomes difficult; at 6-7 persons/m2 people may lose voluntary movement. Trigger route diversion before red. |
| Crush-risk density | N/A | 5-6 persons/m2 | 7+ persons/m2 | Red requires field intervention, route closures, or inflow metering. |
| Gate entry throughput | Venue-specific baseline | 15-25% below expected scan rate for 5+ minutes | 30%+ below expected scan rate or queue spillback | Compare each gate against rolling peer gates, not just a fixed number. |
| Ticket rejection / exception rate | Under 2% | 2-5% | Over 5% or clustered by gate/time | High exception rates create queue shock and security risk. |
| Concession wait time | 0-7 minutes | 8-12 minutes | 13+ minutes | No universal standard found; use local service-level targets and sales abandonment signals. |
| Restroom queue wait time | 0-5 minutes | 6-10 minutes | 11+ minutes or queue blocking concourse | No universal standard found; queue spillback is more important than wait alone. |
| Concourse walking speed | Free-flow | Sustained slowing / stop-start | Stop-and-go waves or counter-flow conflict | Detect from video, depth sensors, or location analytics. |
| Emergency evacuation time | Code/model-specific | Plan deviation | Failure to clear zone by approved emergency plan time | NFPA/local code and the venue emergency plan define acceptable evacuation, not a universal FIFA number. |

## 3. AI/ML In Crowd Analytics

### Predictive crowd modeling

- Pre-event models use ticket sales, kickoff time, weather, transport schedules, gate assignments, team popularity, and fan-zone programming to forecast arrival curves and crowd hotspots.
- Real-time models correct those forecasts with scans, camera counts, transit feeds, mobile telemetry, and incident reports.
- Product implication: store forecast and observed curves separately so operators can see variance rather than only current state.

### Computer vision for density estimation

- Camera models estimate head counts, density maps, queue length, walking direction, and abnormal movement.
- Edge processing reduces latency and can avoid sending raw video to the cloud, which helps privacy and bandwidth.
- Failure modes include occlusion, weather, low light, camera vibration, and bias from training data.

### NLP and sentiment analysis

- Social media, support chats, app feedback, and public safety messages can surface crowd stress before sensors do.
- Useful signals include repeated terms around "stuck", "gate closed", "crush", "water", "medical", "fight", "train", or "police".
- Product implication: aggregate and geofence sentiment. Avoid identifying individual fans unless a formal safety workflow requires it.

### Anomaly detection

- Detects abrupt dwell increases, counter-flow, people running against the dominant direction, abandoned objects, gate failure, scan rejection spikes, and transport platform crowding.
- Best systems combine multiple weak signals. For example, a red alert is stronger when CCTV density, ticket-scan slowdown, and social complaints all converge.

## 4. Real-Time Operational Dashboards

### Core widgets

| Widget | Purpose | Refresh target |
|---|---|---:|
| Venue heatmap | Show density by concourse, plaza, gate, seating bowl, fan zone | 5-15 seconds for sensors/video, 30-60 seconds for mobile analytics |
| Flow arrows | Show direction and speed of movement | 5-15 seconds |
| Gate throughput board | Compare scan rate, queue length, rejection rate, and lane status | 5-10 seconds |
| Transit panel | Rail/bus arrivals, crowding, delays, shuttle dispatch | 30-60 seconds or feed-native |
| Alert queue | Prioritized incidents with owner, severity, SLA timer, and escalation path | Real time |
| KPI cards | Attendance inside, expected arrivals remaining, busiest gate, longest wait, medical/security incidents | 5-60 seconds |
| Camera/sensor confidence | Shows stale feeds, low-confidence zones, and manual override state | Real time |
| Decision log | Records operator action, timestamp, owner, and outcome | Real time |

### Stakeholder views

| Stakeholder | Needs to see | Should not need to see by default |
|---|---|---|
| Command center | Whole-venue density, incidents, transport status, escalations, resource deployment | Raw personal data unless required for a safety incident |
| Security | Perimeter breaches, fights, suspicious objects, gate exceptions, crowd crush risk | Concession revenue details |
| Guest services / volunteers | Fan questions, accessible routes, closed gates, restroom/concession alternatives, multilingual scripts | Law-enforcement-sensitive details |
| Transportation | Arrival curves, station/shuttle load, route closures, parking occupancy, dispersal forecast | Medical details |
| Catering / concessions | Queue length, stock risk, staffing gaps, POS outage, demand by stand | Security identity data |
| Accessibility operations | Elevator status, accessible entrances, wheelchair routes, sensory-room availability, companion-seat issue reports | Full crowd surveillance feed unless relevant |

## 5. Incident Response Protocols

### Standard operating pattern

| Tier | Condition | Command-center action | Field action | Public communication |
|---|---|---|---|---|
| Green | Normal density, queues, and flow | Monitor; compare forecast vs observed | Routine stewarding | Standard wayfinding |
| Amber | Rising density, slow gate, queue spillback, weather/transport disruption, repeated app complaints | Assign owner; verify with second data source; pre-stage staff; start diversion | Open relief gates, change barriers, deploy volunteers, meter inflow | Push route alternatives and estimated waits |
| Red | Crush-risk density, crowd collapse, fight, blocked emergency route, medical cluster, security threat | Incident commander takes control; pause inflow; notify police/fire/EMS; log decisions | Stop movement into zone, clear emergency lanes, open exits, deploy medical/security | Clear, multilingual safety instructions; avoid panic language |

### Communication flow

1. Sensor/social/staff report triggers alert.
2. Command-center operator verifies severity and location.
3. Incident commander assigns owner and field units.
4. Field supervisor confirms conditions and takes immediate controls.
5. Public messaging team sends app, PA, signage, and staff-script updates.
6. Command center monitors recovery metrics and downgrades only after sustained improvement.
7. Post-incident review captures timeline, data quality, decisions, and corrective actions.

### Product requirements derived from protocol

- Every alert needs severity, location, confidence, recommended action, owner, and timer.
- Operators need manual override because sensor confidence can fail in dense or occluded scenes.
- Alerts should cite why they fired, e.g. "Gate C queue 14 min + scan rate down 35% + density 4.7 persons/m2."
- Public messages must support multilingual templates and accessible formats.
- The system should preserve an audit trail for post-event safety review.

## Sources

- Paris 2024 algorithmic video surveillance reporting: https://www.lemonde.fr/en/france/article/2024/08/16/how-algorithmic-video-surveillance-was-used-during-the-paris-olympics_6716745_7.html
- BriefCam / Milestone product page for video synopsis, real-time alerts, dashboards, people counting, and heatmaps: https://www.briefcam.com/
- BriefCam background and video analytics functions: https://en.wikipedia.org/wiki/Briefcam
- Video synopsis method background: https://en.wikipedia.org/wiki/Video_synopsis
- Crowd Connected product page for location analytics, occupancy analytics, app SDKs, heatmaps, dwell time, and event deployments: https://www.crowdconnected.com/
- Crowd Connected profile and technology summary: https://en.wikipedia.org/wiki/Crowd_Connected
- Passive Wi-Fi event analytics research: https://arxiv.org/abs/2002.04401
- Real-time crowd counting research: https://arxiv.org/abs/2002.06515
- RGB-D / 3D people-counting research: https://arxiv.org/abs/1804.04339
- Bottleneck pedestrian-flow research: https://arxiv.org/abs/2007.06396
- Pedestrian doorway flow research: https://arxiv.org/abs/1610.05909
- Crowd density and crush-risk summary with Fruin references: https://en.wikipedia.org/wiki/Crowd_collapses_and_crushes
- UEFA Champions League Final 2022 crowd-control failure summary: https://en.wikipedia.org/wiki/2022_UEFA_Champions_League_final_chaos
- Twitter/social sensing for sports event detection: https://arxiv.org/abs/1205.3212

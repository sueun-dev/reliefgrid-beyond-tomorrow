# Devpost Submission Draft

## Project Name

ReliefGrid

## Tagline

Prioritize response before the crisis spreads.

## Hackathon Fit

ReliefGrid is a social impact, smart automation, and healthcare / climate resilience prototype for the Beyond Tomorrow Summit. The challenge asks for future-facing technology with real-world applicability, scalability, usability, technical execution, and a clear problem-solving approach. ReliefGrid answers that by helping local teams prioritize emergency response when supplies, staffing, transport, and communications are constrained.

## Project Description

ReliefGrid helps local teams decide where limited emergency supplies should go first. It turns noisy crisis signals into a dispatch brief: the top response zone, why it is first, which supplies to send, what to do in the first operating hour, and what fallback to use if the plan slips.

The prototype is built for heatwaves, floods, clinic outages, and community resource shortages where responders need a clear decision faster than a full command center can be assembled.

## Problem

In fast-moving local emergencies, teams often have scarce supplies, incomplete communications, and several neighborhoods that all seem urgent. Without a shared priority model, the first response can go to the loudest report instead of the highest-risk zone.

## Solution

ReliefGrid scores each response zone using severity, vulnerable residents, population exposure, comms reliability, resource fit, and travel friction. It shows the priority route on a canvas map and produces a dispatch brief that can be copied, saved locally, or exported as a PNG.

## Key Features

- Heatwave and flood scenarios.
- Editable incident setup, resources, and zone signals.
- Transparent priority scoring.
- Response map with ranked routes from the relief hub.
- Dispatch brief with first-hour action plan and fallback.
- Local save via `localStorage`.
- Copy brief and PNG export.
- Local WebM demo generator.

## Intended Impact

ReliefGrid is a small but concrete step toward more usable emergency coordination. It helps community teams move from scattered signals to a shared first move, especially when internet access, staffing, or supplies are limited.

## Technology Stack

HTML, CSS, JavaScript, Canvas API, localStorage, MediaRecorder.

## Category Positioning

Primary: Social Impact Solutions, Smart Automation, Healthcare Technology, Sustainability / Climate Innovation.

Secondary: Data & Analytics Platforms, Productivity Solutions.

## Setup Instructions

1. Run:

   ```bash
   python3 -m http.server 8031
   ```

2. Open:

   ```text
   http://127.0.0.1:8031
   ```

3. Choose `Heatwave` or `Flood`, edit the zone signals, and click `Recalculate`.
4. Use `Copy brief`, `Save`, or `Export`.

## Links To Fill Before Final Submission

- GitHub repository:
- Demo video:
- Live demo:

# ⚡ OPENCODE — Task T-007: WCAG 2.2 AA & FIFA Accessibility Standards

> **Paste the `opencode_system_prompt.md` FIRST, then paste this prompt.**

---

## Task T-007: WCAG 2.2 AA & FIFA Accessibility Standards

**Priority**: Medium  
**Deliverable**: Create the file `.agents/research/accessibility_standards.md` in the workspace `/Users/p.c.vsaiteja/Documents/fifa`

---

### Part 1: WCAG 2.2 AA Compliance Checklist

Create a comprehensive checklist organized by category. For each item, include the WCAG criterion ID, requirement, and how it applies to a stadium concierge web app.

#### 1. Visual
- Color contrast ratios (minimum 4.5:1 for text, 3:1 for large text)
- Text sizing (resizable up to 200% without loss)
- Focus indicators (visible focus rings, 2px minimum)
- No information conveyed by color alone
- Spacing and reflow requirements

#### 2. Motor
- Touch/click targets (minimum 44x44 CSS pixels per WCAG 2.2 Target Size)
- Gesture alternatives (no complex gestures required, single-pointer alternatives)
- Dragging alternatives (WCAG 2.2 Dragging Movements criterion)
- Keyboard-only navigation for all interactive elements
- No time-limited interactions without extension options

#### 3. Auditory
- Captions for all audio/video content
- Visual alternatives for audio alerts (flashing indicators, on-screen text)
- Haptic feedback alternatives where applicable
- Transcripts for pre-recorded media

#### 4. Cognitive
- Simple, clear language (aim for 8th-grade reading level)
- Consistent navigation across all screens
- Predictable UI behavior (no unexpected context changes)
- Error identification and recovery suggestions
- Consistent help mechanisms (WCAG 2.2 criterion)

#### 5. Screen Readers
- Semantic HTML5 elements (nav, main, article, aside, section)
- ARIA labels on all interactive elements
- ARIA live regions for dynamic content (chat messages, alerts, crowd updates)
- Proper heading hierarchy (single h1, ordered h2-h6)
- Alt text for all images and SVG elements
- Skip navigation links

#### 6. AI-Specific Accessibility
- Alt text for AI-generated images or content
- Bias detection and mitigation in multilingual AI responses
- Plain-language fallback for AI responses that are too complex
- Confidence indicators for AI-generated information
- User ability to request simpler explanations

### Part 2: FIFA 2026 & ADA Venue Requirements

Research and document:
- FIFA's published accessibility standards for World Cup 2026 venues
- ADA (Americans with Disabilities Act) compliance requirements for US stadiums
- AODA (Accessibility for Ontarians with Disabilities Act) for Canadian venues
- Mexican accessibility regulations for Estadio Azteca and Estadio BBVA/Akron
- Specific requirements: wheelchair seating ratios, companion seating, accessible routes, sensory rooms, assistive listening systems

### Part 3: AR Wayfinding Accessibility

Document how to make Augmented Reality navigation features accessible:
- **Visually impaired users**: Audio turn-by-turn directions, haptic feedback, voice commands
- **Physically impaired users**: Wheelchair-accessible route options, elevator/ramp routing
- **Cognitive accessibility**: Simplified route display, step-by-step instructions, estimated time
- **Fallback**: 2D map view with high-contrast mode when AR is unavailable
- **Camera permission**: Graceful degradation when camera access is denied

### Part 4: Testing Matrix

Create a table for each category:

| Test ID | WCAG Criterion | Test Description | Pass Criteria | Priority |
|---|---|---|---|---|
| V-01 | 1.4.3 Contrast | Text contrast ratio check | ≥ 4.5:1 | High |
| ... | | | | |

### Output Format
- Clean markdown with tables and checklists
- Include WCAG criterion IDs (e.g., 1.4.3, 2.5.8)
- Cite sources where possible

### Rules
- Do NOT modify any `.agents/` tracking files
- Do NOT fabricate standards — if a specific FIFA 2026 document is not found, note it as `[NOT FOUND]`
- Write to `.agents/research/accessibility_standards.md` only

After completing, provide a completion report:
```
## Task Completion Report
### Task: T-007 — WCAG 2.2 AA & FIFA Accessibility Standards
### Files Created: `.agents/research/accessibility_standards.md`
### Ready for Validation: Yes/No
### Known Limitations: <gaps>
```

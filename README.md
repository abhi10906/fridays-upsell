# Fridays Upsell A/B Test

Vanilla JavaScript implementation of an upsell modal for the JoinFridays checkout page. Built as part of a frontend A/B test assignment.

## How to Run

1. Open the target page in Chrome:
   `https://app.joinfridays.com/onboarding/main-info?utm_source=meta&utm_medium=paid_social`
2. Open DevTools Console → press `F12`
3. Type `allow pasting` in the console and press Enter
4. Paste the contents of `upsell-test.js` and press Enter

## Upsell Paths

| User Clicks | Intercepted | Upsell To |
|---|---|---|
| Medication Only (`value="211"`) | ✅ Yes | Monthly Auto-Refill (`value="3"`) |
| Monthly Auto-Refill (`value="3"`) | ✅ Yes | 3-Month Supply (`value="231"`) |
| Other plans | ❌ No | Flows normally |

## How the Popup is Triggered

A single click listener is attached to the radio group container using event delegation in capture phase. When a user clicks a plan card, the handler walks up the DOM to find the label element, reads the radio button's value attribute, and checks if that value exists in the `UPSELL_PATHS` config. If it matches, the default selection is blocked and the modal is shown with the correct content for that path.

Capture phase is used so the handler fires before Radix UI's internal click handler.

## How Plan Selection is Handled

**On Upgrade:** Programmatically calls `.click()` on the target radio button, which triggers Radix UI's internal state update exactly like a real user click — updating `data-state`, `aria-checked`, and the visual selection.

**On Decline:** The originally clicked label is saved before the modal opens. On decline, `.click()` is called on the radio button inside that saved label, restoring the user's intended selection.

## SPA Navigation Handling

The site runs on Next.js so the DOM rebuilds on every route change. Three mechanisms keep the script alive:

1. **MutationObserver** — detects DOM rebuilds and re-attaches the listener when the radio group reappears
2. **history.pushState patch** — resets the listener flag on programmatic navigation
3. **popstate event** — handles browser back/forward button

A `data-ff-attached` flag is stamped on the radio group to prevent duplicate listeners.

## Assumptions

- Plan `value` attributes (`211`, `3`, `231`, `232`, `233`) are stable identifiers — verified via DevTools inspection
- Only the two lower-tier plans need upsell interception per the requirement
- Pricing and copy are placeholder values as allowed by the assignment brief
- Radix UI's internal state updates correctly when `.click()` is called programmatically — confirmed via DevTools

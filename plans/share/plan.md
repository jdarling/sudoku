# Share Functionality — Implementation Plan

## Goal

Allow users to share a puzzle in its current state (including any progress). The share URL
encodes both the puzzle identity and the current board state, so recipients land directly on
the same puzzle at the same point of progress.

URL encoding already exists in the app — this feature wraps it in a shareable UI.

---

## Current URL Format

```
index.html?puzzle=<puzzleId>&board=<ENCODED_STATE>
```

The encoded board state is already handled by the existing BigInt-based encoder in
`js/state.js`. No changes to encoding are needed — this feature only needs to:
1. Generate the full share URL
2. Offer multiple delivery mechanisms

---

## Module API (`js/share.js`)

All pure functions (no DOM access):

```javascript
/**
 * Build a full shareable URL for the current puzzle + board state.
 */
const generateShareLink = (puzzleId, boardState) => string

/**
 * Build a mailto: link with pre-filled subject and body.
 */
const generateEmailLink = (shareUrl) => string

/**
 * Build an sms: link with pre-filled message body.
 */
const generateSMSLink = (shareUrl) => string
```

QR code generation is handled separately in the UI layer (not in `share.js`) since it
involves canvas/DOM operations.

---

## Share Options

### Copy Link
- Copies the full share URL to the clipboard
- Uses `navigator.clipboard.writeText(url)`
- Show brief "Link copied!" status feedback
- Fallback: select a text input containing the URL if clipboard API unavailable

### QR Code
- Generates a QR code image encoding the share URL
- Displayed in the share modal for the user to screenshot or scan
- Library: [`qrcode.js`](https://github.com/davidshimjs/qrcodejs) (CDN, no build step)
- Fallback: display the raw URL as text if QR generation fails

### Email
- Opens the user's default email client with pre-filled content
- `mailto:?subject=Check out this Sudoku puzzle&body=I'm working on this puzzle! [URL]`
- No backend required

### Text / SMS
- Opens SMS app on mobile with pre-filled message
- `sms:?body=Check this out: [URL]`
- On desktop, either shows a copy prompt or is hidden
- Note: share URLs may be long — document this limitation; consider noting that PWA's
  native share API (when implemented) would handle this more gracefully

---

## UI

- Add **Share button** to `#action-row` or a new `#share-row`
- Button opens a `#share-modal`
- Modal contains:
  - Short text: "Share this puzzle at its current state"
  - The share URL in a read-only text field (selectable)
  - Four buttons: Copy Link | Email | Text | QR Code
  - QR code renders below the buttons when selected
- Close button and click-outside-to-dismiss

---

## Open Questions

1. **Button placement**
   In `#action-row` alongside Check/Hint, or a new row? The action row is already two
   buttons wide; adding Share may require a 3-column grid or a new row.

2. **QR code on same screen vs separate step**
   Show QR code immediately in the modal, or only when user clicks "QR Code" button?
   Rendering it eagerly is simpler; on-demand keeps the modal compact.

3. **SMS on desktop**
   On desktop, `sms:` links typically do nothing. Options:
   - Hide SMS button entirely on non-mobile
   - Show it anyway and let the OS handle it
   - Use Web Share API (`navigator.share`) as the SMS trigger when available (integrates with
     native OS share sheet on mobile)

4. **Web Share API integration**
   `navigator.share()` opens the OS-native share sheet on mobile (includes SMS, WhatsApp,
   etc.). Could replace Email + SMS buttons on supported platforms. Should this be the
   primary share mechanism on mobile with Copy Link + QR as fallbacks?

5. **URL length**
   The encoded board state can be long. Test actual URL lengths with fully-filled boards.
   If URLs exceed SMS limits (~160 chars), document the limitation or explore shortening.

---

## Testing

- Verify copied link opens the game with correct puzzle and progress state
- Test email link opens mail client with correct subject and body
- Test SMS link on mobile device
- Test QR code encodes correct URL and is scannable
- Test on both mobile and desktop browsers
- Verify share modal opens and closes correctly
- Test clipboard fallback when `navigator.clipboard` is unavailable

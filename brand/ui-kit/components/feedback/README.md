# StatusBadge

Small status labels for the Blockallisto UI kit.

## Brand and accessibility rule

The support colors are used ONLY in small badges, chips and labels, never on
large surfaces, buttons or hero areas - they must not compete with the
ink + indigo identity. They are ALWAYS paired with Ink #14163A text: white
text on these bright tones fails WCAG contrast.

| Tone | Color | Use for |
| --- | --- | --- |
| `success` | #1DE9B6 | "Funded" |
| `warning` | #FFA726 | "Funding" (open round) |
| `danger`  | #FF5252 | "Closed" / "Underfunded" |

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `tone` | "success" \| "warning" \| "danger" | Required |
| `children` | ReactNode | Short label text |
| `dot` | boolean? | Ink status dot before the label, default true |

Styling: `StatusBadge.css` with the `--bl-*` tokens (inlined fallbacks).

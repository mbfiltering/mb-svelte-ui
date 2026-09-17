# @mbsmart/ui - Component & Utilities Documentation

> Complete reference documentation for all components and utilities in the @mbsmart/ui package.

**Package Version**: 0.1.18  
**Framework**: Svelte 5 (Runes Mode)  
**Styling**: TailwindCSS v4

> This file is the **API reference** — what each component takes and returns. For the
> *design* rules that apply across every MB Smart surface (palette, light↔dark mappings,
> corners, fonts, RTL, accessibility, browser tab titles) see
> [STYLE-GUIDE.md](../mb-specs/resources/STYLE-GUIDE.md).

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Atoms (Basic Components)](#atoms)
   - [AnimatedLogo](#animatedlogo)
   - [Avatar](#avatar)
   - [BackButton](#backbutton)
   - [Badge](#badge)
   - [Callout](#callout)
   - [CheckBox](#checkbox)
   - [CircleButton](#circlebutton)
   - [Clipboard](#clipboard)
   - [ControlButton](#controlbutton)
   - [ExternalLinkText](#externallinktext)
   - [FieldError](#fielderror)
   - [Info](#info)
   - [JSONPrint](#jsonprint)
   - [Kbd](#kbd)
   - [NavButton](#navbutton)
	- [NavDropdown](#navdropdown)
   - [OneFromMany](#onefrommany)
   - [RadioButton](#radiobutton)
   - [SafetyBadge](#safetybadge)
   - [SingleInput](#singleinput)
   - [Skeleton](#skeleton)
   - [Spinner](#spinner)
   - [SvgIcon](#svgicon)
   - [TextInput](#textinput)
   - [TextLink](#textlink)
   - [Toast](#toast)
   - [ToggleSwitch](#toggleswitch)
   - [VisibilityToggle](#visibilitytoggle)
3. [Molecules (Composite Components)](#molecules)
	- [DeviceCard](#devicecard)
   - [Field](#field)
   - [Grid](#grid)
   - [HeaderNav](#headernav)
   - [Island](#island)
	- [ListCard](#listcard)
   - [MultiInput](#multiinput)
   - [NamedControl](#namedcontrol)
   - [PageHeader](#pageheader)
   - [Tabs](#tabs)
4. [Organisms (Complex Components)](#organisms)
   - [Modal](#modal)
   - [QuickLinks](#quicklinks)
   - [SearchableList](#searchablelist)
   - [TermsContent](#termscontent)
   - [ToastContainer](#toastcontainer)
5. [Templates (Page Layouts)](#templates)
   - [AppShell](#appshell)
   - [ErrorPage](#errorpage)
   - [SectionedPage](#sectionedpage)
6. [Utilities](#utilities)
   - [categoryColors](#categorycolors)
   - [dateTime](#datetime)
   - [dismiss](#dismiss)
   - [fieldError](#fielderror-util)
   - [fonts](#fonts)
   - [labels](#labels)
   - [legal](#legal)
   - [minimizedModals](#minimizedmodals)
   - [preferences](#preferences)
   - [stringUtils](#stringutils)
   - [theme](#theme)
   - [toastStore](#toaststore)
   - [urlUtils](#urlutils)
7. [CSS Classes Reference](#css-classes-reference)
   - [`g2` — squircle corners](#g2--continuous-curvature-squircle-corners)
   - [`raised` — 3D surfaces](#raised--light-on-top-shade-underneath)

---

## Installation & Setup

### Install from GitHub

```bash
# Using HTTPS
npm install git+https://github.com/MBFiltering/mb-svelte-ui.git

# Using SSH
npm install git+ssh://git@github.com:MBFiltering/mb-svelte-ui.git

# Or add to package.json
"dependencies": {
  "@mbsmart/ui": "github:MBFiltering/mb-svelte-ui"
}
```

### Import Styles

Add to your main CSS file or root layout:

```css
@import '@mbsmart/ui/styles.css';
```

### Peer Dependencies

Ensure these are installed in your project:

```bash
npm install svelte@^5.0.0 @lucide/svelte@>=0.400.0
```

---

## Atoms

### AnimatedLogo

The spinning 3D MB cube in a white circle, straddling the top edge of a sign-in card.
One component for the three sign-in screens (technician login, customer `AuthCard`,
OAuth `AuthCard`), which used to carry the same four `<img>`s each.

**Import:**

```svelte
<script>
	import { AnimatedLogo } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type       | Default     | Description                                                          |
| ----------- | ---------- | ----------- | -------------------------------------------------------------------- |
| `onclick`   | `function` | `undefined` | Renders a `<button>` (still `aria-hidden`, `tabindex="-1"`) for a hidden gesture |
| `className` | `string`   | `''`        | Extra classes on the circle                                          |

**Usage:**

```svelte
<Island className="relative mt-8 w-full max-w-lg overflow-visible">
	<AnimatedLogo />
	<!-- … -->
</Island>
```

**Behaviour:**

- **Place it inside a `relative` container.** It is `absolute -top-8`, centred, 64px
  (52px cube) below `sm` and 80px (72px cube) from `sm` up.
- **One download, whichever scheme.** The light and dark animations are two CSS
  backgrounds keyed on `.dark`, not two `<img>`s: a hidden `<img>` is still fetched, a
  background under a selector that does not match is not, and that holds on a
  server-rendered page too. There are two files because the cube is drawn onto its
  circle's colour (white / zinc-800) with no transparency.
- **The files are animated WebP** in `src/assets/` (`logo-animated-light.webp` 225 KB,
  `logo-animated-dark.webp` 189 KB), re-encoded from the GIFs in
  `mb-branding/logo/3d-logo/` with sharp at `quality: 80, effort: 6, smartSubsample:
  true`. They replaced two ~670 KB GIFs that every sign-in screen downloaded together.
  Consumers import them through Vite, so they are content-hashed and cached immutably.
  To regenerate after a logo change, encode from the GIFs (or the PNG frames) with the
  same settings and check a frame against the source before committing.

---

Basic building blocks - simple, single-purpose components.

### Avatar

Circular identity mark with a plain-SVG person glyph. Used by `AppShell`'s account chip.

**Import:**

```svelte
<script>
	import { Avatar } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type   | Default    | Description                                                          |
| ----------- | ------ | ---------- | -------------------------------------------------------------------- |
| `size`      | string | `h-8 w-8`  | Tailwind size classes for the circle                                  |
| `className` | string | `''`       | Additional classes (hover states, ring, margin)                       |
| `ariaLabel` | string | `''`       | Give it a name only when it stands alone; empty keeps it `aria-hidden` |

**Usage:**

```svelte
<!-- Beside a visible name: decorative, no accessible name -->
<Avatar />
<span>{userName}</span>

<!-- Alone in a tight row: name it -->
<Avatar size="h-6 w-6" ariaLabel={$t('nav.account')} />
```

**Notes:**

- The glyph is inline SVG in `currentColor`, so the circle recolours with text utilities — pass `group-hover:text-*` in `className` to move the glyph with the name it sits beside.
- `rounded-full` carries **no** `g2`: a squircle at 50% radius is an app-icon blob, not a circle.

---

### BackButton

Back navigation control. It is a `CircleButton` either way: icon-only by default, and a labelled **pill** (arrow + text inside the same button) when you pass `label`. The arrow mirrors automatically in RTL in both variants — the labelled one mirrors its icon, the icon-only one mirrors the whole circle (invisible on a round button). Consumers should not add an RTL class of their own.

Navigation is left to the host app — the library does not depend on a router. Pass `href` to render a real anchor (both variants), or `onclick` (e.g. SvelteKit's `goto`). With neither, the button calls `history.back()`.

**Import:**

```svelte
<script>
	import { BackButton } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type        | Default     | Description                                                                    |
| ----------- | ----------- | ----------- | ------------------------------------------------------------------------------ |
| `label`     | `string`    | `''`          | Empty renders the icon-only circle; a value renders the labelled pill         |
| `href`      | `string`    | `''`          | Renders an `<a>` instead of a `<button>` (either variant)                     |
| `onclick`   | `function`  | -             | Click handler; falls back to `history.back()` when omitted                    |
| `title`     | `string`    | `''`          | Tooltip text                                                                  |
| `ariaLabel` | `string`    | `''`          | Accessible name for the icon-only variant; ignored when `label` is set        |
| `icon`      | `Component` | `ArrowLeft` | Lucide icon component                                                        |
| `iconSize`  | `number`    | `20`          | Size of the icon in pixels                                                    |
| `color`     | `string`    | `'ghost'`     | Passed through to the internal `CircleButton`                                 |
| `size`      | `string`    | `'md'`        | Passed through to the internal `CircleButton`                                 |
| `className` | `string`    | `''`          | Additional CSS classes                                                        |

**Usage:**

```svelte
<!-- Icon-only (default) - goes back in history -->
<BackButton title={$t('common.goBack')} />

<!-- Icon-only with explicit destination -->
<BackButton onclick={() => goto('/dashboard')} />

<!-- Labelled pill: arrow + text inside one button -->
<BackButton label="Back to devices" onclick={() => goto('/customer/home')} />

<!-- Same, as a real link (preferred — middle-click and "open in new tab" work) -->
<BackButton label="Back to devices" href="/customer/home" />
```

---

### Badge

Small outlined indicator pill for status labels like Pro/Basic, Paid/Unpaid.

**Import:**

```svelte
<script>
	import { Badge } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type      | Default   | Description                                                                                  |
| ----------- | --------- | --------- | -------------------------------------------------------------------------------------------- |
| `color`     | `string`  | `'azure'` | Color variant: `'azure'`, `'mulberry'`, `'green'`, `'red'`, `'orange'`, `'yellow'`, `'gray'` |
| `size`      | `string`  | `'small'` | Size variant: `'small'`, `'tiny'`                                                            |
| `className` | `string`  | `''`      | Additional CSS classes                                                                       |
| `children`  | `snippet` | -         | Badge content                                                                                |

**Usage:**

```svelte
<!-- PRO/BASIC indicators -->
<Badge color="mulberry">PRO</Badge>
<Badge color="gray">BASIC</Badge>

<!-- Payment status -->
<Badge color="green" size="small">Paid</Badge>
<Badge color="red" size="tiny">Unpaid</Badge>

<!-- Custom label -->
<Badge color="orange">BETA</Badge>
```

**Styling:**

Badges have a light background with matching border and text color. Dark mode support is built-in.

---

### Callout

Styled container with colored left border for announcements, tips, warnings, and other highlighted content.

**Import:**

```svelte
<script>
	import { Callout } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type      | Default   | Description                                                                    |
| ----------- | --------- | --------- | ------------------------------------------------------------------------------ |
| `color`     | `string`  | `'azure'` | Color variant: `'orange'`, `'azure'`, `'red'`, `'green'`, `'yellow'`, `'gray'` |
| `className` | `string`  | `''`      | Additional CSS classes                                                         |
| `children`  | `snippet` | -         | Callout content                                                                |

**Usage:**

```svelte
<!-- Warning callout -->
<Callout color="orange">
	<p>Warning: This action cannot be undone.</p>
</Callout>

<!-- Info/tip callout -->
<Callout color="azure">
	<p class="font-semibold">Did you know?</p>
	<p>You can use keyboard shortcuts for faster navigation.</p>
</Callout>

<!-- Success callout -->
<Callout color="green">
	<p>Your changes have been saved successfully.</p>
</Callout>

<!-- Error callout -->
<Callout color="red">
	<p>There was an error processing your request.</p>
</Callout>
```

**Styling:**

Callouts have a 4px left border, subtle background tint, and matching text color. Dark mode adjusts colors appropriately.

---

### CheckBox

Custom checkbox with Lucide icons supporting checked, unchecked, and indeterminate states.

**Import:**

```svelte
<script>
	import { CheckBox } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop            | Type       | Default    | Description                       |
| --------------- | ---------- | ---------- | --------------------------------- |
| `checked`       | `boolean`           | `false`     | Whether the checkbox is checked   |
| `indeterminate` | `boolean`           | `false`     | Shows minus icon instead of check |
| `disabled`      | `boolean`           | `false`     | Disables interaction              |
| `ariaLabel`     | `string`            | `''`        | Accessibility label               |
| `error`         | `string \| string[]` | `undefined` | Inline validation message (first of an array) |
| `invalid`       | `boolean`           | `undefined` | Marks the control invalid when the message lives elsewhere (`Field`) |
| `describedBy`   | `string`            | `undefined` | `aria-describedby` id when the message lives elsewhere |
| `onclick`       | `function`          | `() => {}`  | Click handler                     |

**Usage:**

```svelte
<CheckBox checked={isSelected} onclick={() => (isSelected = !isSelected)} ariaLabel="Select item" />

<!-- Indeterminate state (for "some selected") -->
<CheckBox indeterminate={true} onclick={toggleAll} />
```

---

### Clipboard

Copy-to-clipboard button with visual feedback.

**Import:**

```svelte
<script>
	import { Clipboard } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop       | Type      | Default    | Description                                             |
| ---------- | --------- | ---------- | ------------------------------------------------------- |
| `content`  | `string`  | `''`       | Text to copy to clipboard                               |
| `color`    | `string`  | `'ghost2'` | Passed through to the internal `CircleButton` color prop |
| `children` | `snippet` | -          | Optional clickable content                              |

**Usage:**

```svelte
<!-- Icon button only -->
<Clipboard content="Text to copy" />

<!-- Override the internal CircleButton color variant -->
<Clipboard content="Text to copy" color="azure" />

<!-- With clickable content -->
<Clipboard content={device.id}>
	<span class="font-mono">{device.id}</span>
</Clipboard>
```

---

### CircleButton

Circular icon button with color and size variants. Used for inline actions like edit, save, cancel.

Pass `label` and it becomes a **pill**: the same button with text beside the icon. The block padding is unchanged, so a labelled button lines up with an icon-only one in the same row; only the inline sides grow. Pass `href` and it renders an `<a>` instead of a `<button>`, so the control can be a real link.

**Import:**

```svelte
<script>
	import { CircleButton } from '@mbsmart/ui/atoms';
	import { Pencil, Check, X } from '@lucide/svelte';
</script>
```

**Props:**

| Prop        | Type        | Default    | Description                                                                              |
| ----------- | ----------- | ---------- | ---------------------------------------------------------------------------------------- |
| `onclick`       | `function`  | `() => {}` | Click handler                                                                        |
| `href`          | `string`    | `''`       | Renders an `<a>` instead of a `<button>`. `disabled`/`loading`/`type` do not apply to an anchor and are ignored |
| `label`         | `string`    | `''`       | Visible text beside the icon. Turns the circle into a pill and supplies the accessible name |
| `disabled`      | `boolean`   | `false`    | Disables the button                                                                  |
| `loading`       | `boolean`   | `false`    | In-flight state. Disables the button, sets `aria-busy` and `cursor-wait`, and shows the wait in the icon's place. Do not also pass `disabled` |
| `spinIcon`      | `boolean`   | `false`    | While `loading`, spin `icon` in place instead of swapping in a spinner. For icons that already mean the action, e.g. `RefreshCw` |
| `title`         | `string`    | `''`       | Tooltip text                                                                         |
| `ariaLabel`     | `string`    | `''`       | Accessible name. An icon-only button needs one — a `title` is a tooltip, not a name. Ignored when `label` is set, so the two can never disagree |
| `type`          | `string`    | `'button'` | Button type: `'button'`, `'submit'`, `'reset'`                                       |
| `color`         | `string`    | `'ghost'`  | Color variant: `'ghost'`, `'ghost2'`, `'azure'`, `'green'`, `'red'`, `'orange'`, `'gray'` |
| `size`          | `string`    | `'md'`     | Size variant: `'sm'`, `'md'`, `'lg'`                                                 |
| `icon`          | `Component` | -          | Lucide icon component                                                                |
| `iconSize`      | `number`    | `18`       | Size of the icon in pixels                                                           |
| `className`     | `string`    | `''`       | Additional CSS classes on the button                                                 |
| `iconClassName` | `string`    | `''`       | Additional CSS classes on the icon — for a directional glyph that must mirror in RTL without mirroring the label |

**Usage:**

```svelte
<!-- Ghost button (default) - transparent background with hover effect -->
<CircleButton onclick={startEditing} title="Edit" ariaLabel={$t('common.edit')} icon={Pencil} />

<!-- Colored button for primary actions -->
<CircleButton onclick={save} color="azure" title="Save" ariaLabel={$t('common.save')} icon={Check} />

<!-- Disabled state -->
<CircleButton onclick={cancel} disabled={isSaving} title="Cancel" icon={X} />

<!-- In flight: the RefreshCw glyph spins where it stands -->
<CircleButton
	onclick={handleSync}
	loading={isSyncing}
	spinIcon
	icon={RefreshCw}
	ariaLabel={$t('common.requestDeviceSync')}
/>

<!-- Custom icon size -->
<CircleButton onclick={doSomething} icon={Pencil} iconSize={24} size="lg" />

<!-- Labelled pill — the label is the accessible name, so no ariaLabel -->
<CircleButton onclick={startEditing} icon={Pencil} label={$t('common.edit')} />

<!-- As a real link -->
<CircleButton href="/customer/home" icon={House} label={$t('nav.home')} color="azure" />
```

---

### ControlButton

Styled button with color and size variants.

**Import:**

```svelte
<script>
	import { ControlButton } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop           | Type       | Default    | Description                                                        |
| -------------- | ---------- | ---------- | ------------------------------------------------------------------ |
| `onclick`      | `function` | `() => {}` | Click handler                                                      |
| `disabled`     | `boolean`  | `false`    | Disables the button                                                |
| `loading`      | `boolean`  | `false`    | In-flight state. Disables the button, sets `aria-busy` and `cursor-wait`, and overlays a spinner without resizing it. Do not also pass `disabled` |
| `loadingLabel` | `string`   | `''`       | Text to show *instead of* the children while `loading` — e.g. `'Saving…'`. Omit to keep the button's own label in place, hidden under the spinner |
| `color`        | `string`   | `'azure'`  | Color variant: `'azure'`, `'green'`, `'orange'`, `'red'`, `'gray'`, `'black'`, `'transparent'` |
| `size`         | `string`   | `'md'`     | Size variant: `'sm'`, `'md'`, `'lg'`                               |
| `type`         | `string`   | `'button'` | Button type: `'button'`, `'submit'`, `'reset'`                     |
| `className`    | `string`   | `''`       | Additional CSS classes                                             |
| `children`     | `snippet`  | -          | Button content                                                     |

A disabled button (or a `loading` one, which is disabled too) is inert under the
pointer: it keeps its gray fill, drops back to a flat surface and neither lifts nor
casts a shadow on hover, so an action that cannot be taken never looks clickable.

**The button is a physical object.** It carries [`raised`](#raised--light-on-top-shade-underneath) —
lit along the top edge, shaded along the bottom, and casting a shadow that grows as
it rises on hover — and it shrinks slightly while held down. The `transparent`
variant opts out: with no fill there is no face to light, and the rim would draw the
outline of a button the design is deliberately not showing. Both movements are
`motion-safe:`, so under `prefers-reduced-motion: reduce` the button still lights
and shades and lifts its shadow but never scales.

**`disabled` vs `loading`.** They are not interchangeable: `disabled` means *you
may not*, `loading` means *you did, and it is working*. `loading` already implies
`disabled`, so pass one or the other, never both for the same flag.

**Loading does not resize the button.** Without `loadingLabel` the children keep
their box at `opacity-0` and the spinner is laid over that reserved space, so the
button never grows or jumps under the pointer mid-click. They stay in the
accessibility tree, so the button keeps its accessible name while busy. Give
`loadingLabel` only where the wait is long enough to be worth naming — then the
button *does* resize to fit the new text, which is the point.

**Not every button wants this.** An action whose result is applied optimistically
should stay optimistic; adding `loading` to it trades a fast-feeling UI for a
spinner nobody asked for. Reach for `loading` where the user must actually wait on
the network before anything changes on screen — form submits, above all.

**Usage:**

```svelte
<ControlButton onclick={handleSave} color="green" size="md">Save Changes</ControlButton>

<!-- In flight: same box, label hidden under the spinner -->
<ControlButton onclick={handleDelete} color="red" loading={isDeleting}>Delete</ControlButton>

<!-- A wait worth naming -->
<ControlButton onclick={handleSync} loading={isSyncing} loadingLabel={$t('common.syncing')}>
	{$t('common.sync')}
</ControlButton>

<!-- Submit button in a form -->
<form onsubmit={handleSubmit}>
	<ControlButton type="submit" color="azure" loading={$submitting}>Submit</ControlButton>
</form>

<!-- Gray variant for neutral actions -->
<ControlButton color="gray" onclick={handleCancel}>Cancel</ControlButton>
```

---

### ExternalLinkText

External link with icon that opens in a new tab.

**Import:**

```svelte
<script>
	import { ExternalLinkText } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type     | Default            | Description         |
| ----------- | -------- | ------------------ | ------------------- |
| `href`      | `string` | `''`               | Link URL            |
| `text`      | `string` | `''`               | Link text           |
| `className` | `string` | `'text-azure-700'` | CSS classes         |
| `iconSize`  | `number` | `18`               | Icon size in pixels |

**Usage:**

```svelte
<ExternalLinkText href="https://example.com" text="Visit Website" />
```

---

### FieldError

The inline validation message used by `TextInput`, `Field` and `CheckBox`. Host apps rarely render this directly.

**Import:**

```svelte
<script>
	import { FieldError } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type     | Default     | Description                         |
| ----------- | -------- | ----------- | ----------------------------------- |
| `id`        | `string` | `undefined` | Id the control points at with `aria-describedby` |
| `message`   | `string` | `''`        | The error text. Renders nothing when empty |
| `className` | `string` | `''`        | Extra classes (e.g. `mt-1.5`)       |

Renders with `role="alert"`, `red-alt` colour, and a `CircleAlert` icon so the state is not colour alone.

---

### Info

Tooltip or inline info component with a directory of predefined help texts.

**Import:**

```svelte
<script>
	import { Info } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop      | Type     | Default     | Description                                |
| --------- | -------- | ----------- | ------------------------------------------ |
| `label`   | `string` | `''`        | Key to look up in the info directory       |
| `variant` | `string` | `'tooltip'` | Display variant: `'tooltip'` or `'inline'` |

**Usage:**

```svelte
<!-- Tooltip on hover -->
<Info label="Device Protection" />

<!-- Inline text display -->
<Info label="Device Protection" variant="inline" />
```

**Built-in Labels:**
The component has a built-in directory of help texts for common labels like:

- `'Device Protection'`
- `'Bypass App Approval Requests'`
- Category-specific help (e.g., `'Banks_app'`, `'Torah_site'`)

---

### JSONPrint

Pretty-print JSON data in a preformatted block.

**Import:**

```svelte
<script>
	import { JSONPrint } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop   | Type  | Default | Description             |
| ------ | ----- | ------- | ----------------------- |
| `data` | `any` | -       | Data to display as JSON |

**Usage:**

```svelte
<JSONPrint data={apiResponse} />
```

---

### Kbd

Keyboard shortcut display badge.

**Import:**

```svelte
<script>
	import { Kbd } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop       | Type      | Default | Description            |
| ---------- | --------- | ------- | ---------------------- |
| `children` | `snippet` | -       | Keyboard shortcut text |

**Usage:**

```svelte
<Kbd>Alt + Shift + K</Kbd>

<p>Press <Kbd>ESC</Kbd> to close</p>
```

**Note:** Elements with this component have the `kbd-helper` class and can be hidden via the `html.hide-kbd` class.

### NavButton

Navigation button or link for headers, toolbars, and navigation actions. Supports color variants and Lucide icons.

**Import:**

```svelte
<script>
	import { NavButton } from '@mbsmart/ui/atoms';
	import { LogOut, Settings, UserRoundPlus } from '@lucide/svelte';
</script>
```

**Props:**

| Prop        | Type      | Default   | Description                                    |
| ----------- | --------- | --------- | ---------------------------------------------- |
| `href`      | string    | `null`    | Link destination (renders as `<a>` if set)     |
| `onclick`   | function  | `null`    | Click handler (renders as `<button>` if set)   |
| `icon`      | component | `null`    | Lucide icon component (e.g. `LogOut`)          |
| `label`     | string    | `''`      | Button/link label text                         |
| `title`     | string    | `''`      | Tooltip text                                   |
| `color`     | string    | `'azure'` | Color variant: `azure`, `red`, `green`, `gray` |
| `className` | string    | `''`      | Additional CSS classes                         |
| `disabled`  | boolean   | `false`   | Disabled state                                 |

**Usage:**

```svelte
<!-- Link variant -->
<NavButton href="/dashboard/settings" icon={Settings} label="Settings" color="azure" />

<!-- Button variant -->
<NavButton onclick={logout} icon={LogOut} label="Logout" color="red" />

<!-- Custom color -->
<NavButton href="/dashboard/device/new" icon={UserRoundPlus} label="New Device" color="green" />
```

**Notes:**

- Responsive: label is hidden on small screens, shown on `lg` and up.
- Always use Lucide icons for consistency.
- Use for navigation actions in headers, toolbars, and page layouts.

### NavDropdown

Dropdown group of navigation actions. The trigger matches `NavButton` styling and opens a menu of button or link entries using the same config shape as `NavButton`.

**Import:**

```svelte
<script>
	import { NavDropdown } from '@mbsmart/ui/atoms';
	import { Folder, LogOut, Settings, UserRoundPlus } from '@lucide/svelte';
</script>
```

**Props:**

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `config` | `array` | `[]` | Array of nav items using the `NavButton` prop shape: `{ href, onclick, icon, label, title, color, disabled, className }` |
| `icon` | `component` | `null` | Lucide icon component shown in the trigger |
| `label` | `string` | `''` | Trigger label text |
| `title` | `string` | `''` | Trigger tooltip and accessible label |
| `color` | `string` | `'azure'` | Trigger color variant: `azure`, `red`, `green`, `gray` |
| `disabled` | `boolean` | `false` | Disables the trigger |
| `className` | `string` | `''` | Additional CSS classes for the trigger |
| `dropdownClassName` | `string` | `''` | Additional CSS classes for the dropdown container |

**Usage:**

```svelte
<script>
	const navItems = [
		{ href: '/dashboard/device/new', icon: UserRoundPlus, label: 'New Device', color: 'green' },
		{ href: '/dashboard/settings', icon: Settings, label: 'Settings', color: 'azure' },
		{ onclick: logout, icon: LogOut, label: 'Logout', color: 'red' }
	];
</script>

<NavDropdown
	icon={Folder}
	label="Actions"
	title="Open navigation actions"
	color="azure"
	config={navItems}
/>
```

**Notes:**

- The trigger uses the same visual language and responsive label behavior as `NavButton`.
- Each dropdown item can be a link or button, based on the same `href` and `onclick` rules as `NavButton`.
- The dropdown closes on item selection, outside click, or `Escape`.

Segmented button selector for choosing one option from a list.

**Import:**

```svelte
<script>
	import { OneFromMany } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop       | Type       | Default    | Description                                    |
| ---------- | ---------- | ---------- | ---------------------------------------------- |
| `options`  | `array`    | `[]`       | Array of option objects (see below)            |
| `selected` | `string`   | `''`       | Currently selected value                       |
| `value`    | `string`   | `''`       | Alias for `selected` (backwards compatibility) |
| `onChange` | `function` | `() => {}` | Callback with new value                        |
| `onSelect` | `function` | `() => {}` | Alias for `onChange`                           |
| `disabled` | `boolean`  | `false`    | Disables all options                           |
| `visibleCount` | `number` | `2` | How many options render as visible buttons; when `options.length > visibleCount` the last visible slot becomes a dropdown containing the remaining options. Values `<= 1` render a single fully clickable dropdown control |
| `ariaLabel` | `string` | `''` | Names the group, e.g. `"App status: WhatsApp"` |

**Option object:**

| Field        | Type      | Description |
| ------------ | --------- | ----------- |
| `value`      | `string`  | Option value (required) |
| `label`      | `string`  | Display label |
| `color`      | `string`  | Tailwind bg class when selected. Azure options take `bg-azure-600` — azure-500 measures 3.56:1 against white, a WCAG 1.4.3 failure |
| `textColor`  | `string`  | Text color when selected (defaults to `'text-white'`) |
| `disabled`   | `boolean` | When true, this option cannot be selected (permission-gating, etc.) |
| `cursor`     | `string`  | Optional Tailwind cursor class when the option is interactive |

**Usage:**

```svelte
<script>
	let status = 'blocked';

	const options = [
		{ value: 'blocked', label: 'Blocked', color: 'bg-red-alt-500', disabled: true },
		{ value: 'allowed', label: 'Allowed', color: 'bg-green-alt-500', textColor: 'text-white' },
		{ value: 'filtered', label: 'Filtered', color: 'bg-azure-600', disabled: !canFilter }
	];
</script>

<OneFromMany {options} selected={status} onChange={(val) => (status = val)} ariaLabel="Site status" />
```

**Accessibility:** the wrapper is a `role="group"` named by `ariaLabel` and each
visible option carries `aria-pressed`. **Always pass `ariaLabel`** — without it
the options announce as loose "Blocked"/"Allowed" buttons with nothing tying
them together, which is useless in the repeated rows this component is built
for. The transparent `<select>` behind the dropdown slot takes the same name; in
dropdown-only mode (`visibleCount <= 1`) the decorative button is `aria-hidden`
and untabbable so the `<select>` is the single control.

**Behavior:**

- Shows up to `visibleCount` options as visible controls (default `2`)
- When `options.length > visibleCount` the last visible slot becomes a dropdown containing the remaining options
- When `visibleCount <= 1`, the component renders as a single fully clickable dropdown control
- Remembers last dropdown selection for toggle behavior
- Per-option `disabled` greys out that choice and blocks selection; global `disabled` still disables the whole control

---

### RadioButton

Custom radio button with azure-700 styling.

**Import:**

```svelte
<script>
	import { RadioButton } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type       | Default    | Description               |
| ----------- | ---------- | ---------- | ------------------------- |
| `checked`   | `boolean`  | `false`    | Whether radio is selected |
| `disabled`  | `boolean`  | `false`    | Disables interaction      |
| `name`      | `string`   | `''`       | Radio group name          |
| `value`     | `string`   | `''`       | Radio value               |
| `ariaLabel` | `string`   | `''`       | Accessibility label       |
| `onchange`  | `function` | `() => {}` | Change handler            |

**Usage:**

```svelte
<RadioButton
	name="priority"
	value="high"
	checked={priority === 'high'}
	onchange={() => (priority = 'high')}
/>
```

---

### SafetyBadge

Risk level badge with color-coded styling.

**Import:**

```svelte
<script>
	import { SafetyBadge } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type      | Default | Description                                                        |
| ----------- | --------- | ------- | ------------------------------------------------------------------ |
| `colorKey`  | `string`  | `''`    | Direct color: `'green'`, `'yellow'`, `'orange'`, `'red'`, `'gray'` |
| `label`     | `string`  | `''`    | Category label to derive color from                                |
| `showLabel` | `boolean` | `true`  | Whether to show risk text                                          |
| `size`      | `string`  | `'sm'`  | Size: `'xs'`, `'sm'`, `'md'`                                       |
| `className` | `string`  | `''`    | Additional CSS classes                                             |

**Color/Label Mapping:**

| Color    | Risk Label | Example Categories            |
| -------- | ---------- | ----------------------------- |
| `green`  | Trusted    | tools, banks, torah, jewish   |
| `yellow` | Caution    | travel, safe shopping, health |
| `orange` | Risk       | games, shopping, news, media  |
| `red`    | Danger     | social media, mature, proxies |
| `gray`   | Unknown    | (default/unmapped)            |

**Usage:**

```svelte
<!-- With direct colorKey -->
<SafetyBadge colorKey="green" />

<!-- With category label (auto-derives color) -->
<SafetyBadge label="Games" />

<!-- Compact size -->
<SafetyBadge colorKey={category.color} size="xs" />
```

---

### SingleInput

Inline editable field with Edit/Save/Cancel functionality.

**Import:**

```svelte
<script>
	import { SingleInput } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop               | Type       | Default               | Description                             |
| ------------------ | ---------- | --------------------- | --------------------------------------- |
| `label`            | `string`   | `'Field'`             | Field label                             |
| `hideLabel`        | `boolean`  | `false`               | Hide the label text                     |
| `value`            | `string`   | `''`                  | Current value                           |
| `placeholder`      | `string`   | `'Enter value...'`    | Input placeholder                       |
| `rows`             | `number`   | `3`                   | Rows for textarea                       |
| `type`             | `string`   | `'textarea'`          | `'textarea'` or `'text'`                |
| `size`             | `string`   | `'sm'`                | Display text size: `'sm'` or `'lg'`     |
| `showClipboard`    | `boolean`  | `true`                | Show copy-to-clipboard button when value is set |
| `onSave`           | `function` | `async () => {}`      | Async save function, receives new value |
| `onUpdate`         | `function` | `() => {}`            | Callback after successful save          |
| `editTitle`        | `string`   | `'Edit'`              | Tooltip for the edit button             |
| `saveTitle`        | `string`   | `'Save'`              | Tooltip for the save button             |
| `savingTitle`      | `string`   | `'Saving...'`         | Tooltip while save is in progress       |
| `cancelTitle`      | `string`   | `'Cancel'`            | Tooltip for the cancel button           |
| `noChangesMessage` | `string`   | `'No changes to save'`| Toast when save is clicked with no change |
| `emptyMessage`     | `string`   | `''`                  | Empty-state copy (defaults from label)  |
| `disabled`         | `boolean`  | `false`               | Disables edit/save/cancel and the input |

**onSave Contract:**
Must return `{ ok: true }` for success or `{ error: 'message' }` for failure.

**Usage:**

```svelte
<SingleInput
	label="Notes"
	value={device.notes}
	type="textarea"
	rows={3}
	onSave={async (newNotes) => {
		const result = await updateDevice({ notes: newNotes });
		return result;
	}}
	onUpdate={(newNotes) => (device.notes = newNotes)}
/>
```

---

### Skeleton

Loading placeholder with configurable rows and columns.

**Import:**

```svelte
<script>
	import { Skeleton } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type     | Default        | Description                 |
| ----------- | -------- | -------------- | --------------------------- |
| `height`    | `string` | `'h-48'`       | Height class                |
| `width`     | `string` | `''`           | Width class                 |
| `rounded`   | `string` | `'g2 rounded-xl'` | Border radius class. Pass a plain radius (e.g. `'rounded-full'`) to opt out of the [`g2`](#g2--continuous-curvature-squircle-corners) corner — a skeleton should trace the shape of whatever it stands in for. |
| `className` | `string` | `''`           | Additional classes          |
| `rows`      | `array`  | `[]`           | Row definitions (see below) |

**Row Definitions:**

- String: Full-width row with that height, e.g., `'h-6'`
- Object: Grid layout, e.g., `{ columns: 2, height: 'h-4' }`
- Object with column spans: `{ columns: [1, 3], height: 'h-6' }` (1fr and 3fr)

**Usage:**

```svelte
<!-- Simple skeleton -->
<Skeleton height="h-32" />

<!-- Complex skeleton with rows -->
<Skeleton
	rows={[
		'h-6', // Full-width
		{ columns: 2, height: 'h-4' }, // 2-column grid
		'h-4', // Full-width
		{ columns: [1, 3], height: 'h-8' } // 1fr + 3fr columns
	]}
/>
```

---

### Spinner

Loading spinner with LoaderCircle icon, for a page or panel waiting on its data.

**Import:**

```svelte
<script>
	import { Spinner } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type      | Default           | Description                                                                 |
| ----------- | --------- | ----------------- | --------------------------------------------------------------------------- |
| `size`      | `number`  | `32`              | Icon size in pixels                                                         |
| `color`     | `string`  | `'text-gray-500'` | Color class                                                                 |
| `block`     | `boolean` | `true`            | Reserve `py-8` around the spinner. Pass `false` where it sits inline beside other content |
| `className` | `string`  | `''`              | Additional classes                                                          |

**Not for inside a button.** `ControlButton` and `CircleButton` have their own
`loading` prop, which overlays the spinner without resizing the control. Dropping
a `Spinner` into a fixed-height button instead means 64px of `block` padding
fighting the button for room, and the label vanishing along with the button's
accessible name.

**Usage:**

```svelte
<!-- Panel waiting on its first load -->
<Spinner />

<Spinner size={24} color="text-azure-500" />

<!-- Inline beside a label — no reserved padding -->
<div class="flex items-center gap-3">
	<Spinner size={20} block={false} />
	<span>{$t('device.loadingDetails')}</span>
</div>
```

---

### SvgIcon

Inline SVG icons from `/static/icons` directory.

**Import:**

```svelte
<script>
	import { SvgIcon } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type     | Default     | Description                    |
| ----------- | -------- | ----------- | ------------------------------ |
| `name`      | `string` | -           | Icon filename (without `.svg`), matching `^[a-zA-Z0-9_-]+$` |
| `size`      | `string` | `'w-6 h-6'` | Tailwind size classes          |
| `className` | `string` | `''`        | Additional classes             |

**Usage:**

```svelte
<SvgIcon name="apple-logo" size="w-8 h-8" />

<SvgIcon name="android" className="text-green-500" />
```

**Note:** Icons are fetched from `/icons/{name}.svg` and inherit `currentColor`. The
fetched file content is injected with `{@html}`, so only first-party icons under
`/static/icons` should be served from that path. As a safeguard, `name` is validated
against `^[a-zA-Z0-9_-]+$`; any value containing slashes, dots, or other characters is
rejected (renders the error placeholder) rather than fetched — this prevents path
traversal and keeps the `{@html}` sink from being pointed at an unexpected URL.

**Each icon is fetched once per page lifetime.** A module-level cache shares the
markup between every instance, and concurrent mounts of the same icon share one
request. An icon that has already loaded renders on the first frame of any later
mount, so re-keying islands (section switch, collapse all) no longer re-requests it
or flashes an empty box. A failed fetch is not remembered; the next mount retries.

---

### TextInput

Styled text input component for text, password, email, textarea, and other text-based inputs.

**Import:**

```svelte
<script>
	import { TextInput } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop             | Type       | Default     | Description                                                                                                |
| ---------------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `type`           | `string`   | `'text'`    | Input type: `'text'`, `'password'`, `'email'`, `'tel'`, `'textarea'`, `'number'`, `'datetime-local'`, etc. |
| `value`          | `string`   | `''`        | Input value (bindable)                                                                                     |
| `placeholder`    | `string`   | `''`        | Placeholder text                                                                                           |
| `disabled`       | `boolean`  | `false`     | Disables the input                                                                                         |
| `id`             | `string`   | `''`        | Input ID attribute                                                                                         |
| `name`           | `string`   | `''`        | Input name attribute                                                                                       |
| `ariaLabel`      | `string`   | `''`        | Accessibility label                                                                                        |
| `autocomplete`   | `string`   | `''`        | Autocomplete attribute                                                                                     |
| `required`       | `boolean`  | `false`     | Makes input required                                                                                       |
| `readonly`       | `boolean`  | `false`     | Makes input readonly                                                                                       |
| `maxlength`      | `number`   | `undefined` | Maximum character length                                                                                   |
| `minlength`      | `number`   | `undefined` | Minimum character length                                                                                   |
| `pattern`        | `string`   | `undefined` | Validation pattern                                                                                         |
| `min`            | `number`   | `undefined` | Minimum value (for number/date inputs)                                                                     |
| `max`            | `number`   | `undefined` | Maximum value (for number/date inputs)                                                                     |
| `step`           | `number`   | `undefined` | Step increment (for number inputs)                                                                         |
| `rows`           | `number`   | `4`         | Number of rows (for textarea)                                                                              |
| `size`           | `string`   | `'md'`      | Size variant: `'sm'`, `'md'`, `'lg'`                                                                       |
| `variant`        | `string`   | `'default'` | Style variant: `'default'`, `'error'`, `'success'`                                                         |
| `showSearchIcon` | `boolean`            | `false`     | Show magnifying glass icon on left side                                                                    |
| `className`      | `string`             | `''`        | Additional CSS classes                                                                                     |
| `label`          | `string`             | `''`        | Visible label above the control. When set, it is the accessible name (do not also pass `ariaLabel`)        |
| `hint`           | `string`             | `''`        | Helper text under the control. Hidden while `error` is showing                                             |
| `textInfo`       | `string`             | `''`        | Alias for `hint` (the portals' previous Field prop)                                                        |
| `error`          | `string \| string[]` | `undefined` | Validation message under the control. Arrays show the first entry only. Sets `aria-invalid` and the error variant |
| `invalid`        | `boolean`            | `undefined` | Marks the control invalid without a message (when `Field` owns the copy)                                   |
| `describedBy`    | `string`             | `undefined` | Extra `aria-describedby` id. Combined with the error message's id when both are set                        |
| `onchange`       | `function`           | `() => {}`  | Change event handler                                                                                       |
| `oninput`        | `function` | `() => {}`  | Input event handler                                                                                        |
| `onkeydown`      | `function` | `() => {}`  | Keydown event handler                                                                                      |
| `onkeypress`     | `function` | `() => {}`  | Keypress event handler                                                                                     |
| `onkeyup`        | `function` | `() => {}`  | Keyup event handler                                                                                        |
| `onfocus`        | `function` | `() => {}`  | Focus event handler                                                                                        |
| `onblur`         | `function` | `() => {}`  | Blur event handler                                                                                         |

**Size Variants:**

| Size | Padding       |
| ---- | ------------- |
| `sm` | `px-2 py-1.5` |
| `md` | `px-3 py-2.5` |
| `lg` | `px-4 py-3`   |

**Style Variants:**

| Variant   | Border Color | Use Case                 |
| --------- | ------------ | ------------------------ |
| `default` | Gray → Azure | Standard input           |
| `error`   | Red          | Validation error state   |
| `success` | Green        | Validation success state |

**Usage:**

```svelte
<script>
	import { TextInput } from '@mbsmart/ui/atoms';
	let username = '';
	let password = '';
	let email = '';
	let notes = '';
	let searchQuery = '';
</script>

<!-- Basic text input -->
<TextInput placeholder="Enter username" bind:value={username} />

<!-- Password with built-in visibility toggle -->
<TextInput type="password" placeholder="Enter password" bind:value={password} />

<!-- Email with an inline validation message (preferred over a toast) -->
<TextInput
	type="email"
	label="Email"
	placeholder="Email address"
	bind:value={email}
	error={email && !email.includes('@') ? 'Enter a valid email' : undefined}
/>

<!-- Textarea for multi-line input -->
<TextInput type="textarea" placeholder="Enter notes..." bind:value={notes} rows={4} />

<!-- Search input with magnifying glass icon -->
<TextInput placeholder="Search..." bind:value={searchQuery} showSearchIcon size="sm" />

<!-- Number input with min/max/step -->
<TextInput type="number" min={0} max={100} step={5} bind:value={quantity} />

<!-- Different sizes -->
<TextInput size="sm" placeholder="Small input" />
<TextInput size="md" placeholder="Medium input" />
<TextInput size="lg" placeholder="Large input" />

<!-- With event handlers -->
<TextInput
	placeholder="Press Enter to submit"
	bind:value={searchQuery}
	onkeypress={(e) => e.key === 'Enter' && handleSubmit()}
/>
```

**Password Visibility Toggle:**

When `type="password"`, a built-in eye icon button appears that toggles between showing and hiding the password. This is handled automatically - no additional props needed.

**Search Icon:**

When `showSearchIcon` is true, a magnifying glass icon appears on the left side of the input. The icon color changes to azure on focus.

---

### TextLink

Inline text link/button for secondary actions ("Log in", "Back to login", "Forgot password?"). Renders an `<a>` when `href` is set, otherwise a `<button>` (use `onclick`).

**Import:**

```svelte
<script>
	import { TextLink } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type                  | Default     | Description                                          |
| ----------- | --------------------- | ----------- | ---------------------------------------------------- |
| `href`      | `string`              | `''`        | Link URL. When set, renders an `<a>`.                |
| `onclick`   | `function \| null`    | `null`      | Click handler for button mode.                       |
| `color`     | `'azure' \| 'muted'`  | `'azure'`   | `azure` for accent links, `muted` for subtle grays.  |
| `type`      | `string`              | `'button'`  | Button type (button mode only).                      |
| `disabled`  | `boolean`             | `false`     | Disables the button.                                 |
| `className` | `string`              | `''`        | Extra classes (e.g. `text-sm`, `w-full`).            |

**Usage:**

```svelte
<TextLink onclick={() => goto('/auth/login')}>Log in</TextLink>
<TextLink href="/terms">Terms</TextLink>
<TextLink color="muted" className="text-sm" onclick={goBack}>Back to login</TextLink>
```

---

### Toast

Individual toast notification component (usually used via ToastContainer).

**Import:**

```svelte
<script>
	import { Toast } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop       | Type       | Default     | Description                                         |
| ---------- | ---------- | ----------- | --------------------------------------------------- |
| `message`  | `string`   | `''`        | Toast message                                       |
| `type`     | `string`   | `'success'` | Type: `'success'`, `'error'`, `'info'`, `'warning'` |
| `duration` | `number`   | `8000`      | Auto-dismiss in ms (0 = no auto-dismiss)            |
| `onClose`  | `function` | `() => {}`  | Close callback                                      |

**Type Styling:**

| Type      | Color  | Default Duration |
| --------- | ------ | ---------------- |
| `success` | Green  | 8000ms           |
| `error`   | Red    | 30000ms          |
| `info`    | Blue   | 8000ms           |
| `warning` | Yellow | 10000ms          |

The countdown **pauses while the pointer is over the toast or focus is inside it**, so these are idle timeouts, not hard cut-offs. Errors used to persist until dismissed; they now expire after 30s so a stack of them cannot cover the page for someone who does not know how to close them. Pass `duration: 0` to opt back into persist-until-dismissed.

---

### ToggleSwitch

Toggle switch with default and icon variants.

**Import:**

```svelte
<script>
	import { ToggleSwitch } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop          | Type        | Default          | Description                         |
| ------------- | ----------- | ---------------- | ----------------------------------- |
| `label`       | `string`    | `''`             | Used for aria-label                 |
| `customLabel` | `string`    | `null`           | Override aria-label                 |
| `checked`     | `boolean`   | `false`          | Toggle state                        |
| `onChange`    | `function`  | `() => {}`       | Callback with new value             |
| `disabled`    | `boolean`   | `false`          | Disables toggle                     |
| `colorOn`     | `string`    | `'bg-azure-600'` | Background when on                  |
| `colorOff`    | `string`    | `'bg-gray-300'`  | Background when off                 |
| `variant`     | `string`    | `'default'`      | `'default'` or `'icon'`             |
| `iconOn`      | `component` | `null`           | Lucide icon when on (icon variant)  |
| `iconOff`     | `component` | `null`           | Lucide icon when off (icon variant) |
| `iconSize`    | `number`    | `18`             | Icon size (icon variant)            |
| `onText`      | `string`    | `'On'`           | i18n "On" text                      |
| `offText`     | `string`    | `'Off'`          | i18n "Off" text                     |

**Usage:**

```svelte
<!-- Icon variant -->
<script>
	import { Lock, LockOpen } from '@lucide/svelte';
</script>

<!-- Default switch -->
<ToggleSwitch checked={isEnabled} onChange={(val) => (isEnabled = val)} />

<ToggleSwitch
	variant="icon"
	iconOn={Lock}
	iconOff={LockOpen}
	checked={isLocked}
	onChange={(val) => (isLocked = val)}
/>
```

The default variant's knob squash-and-stretches slightly as it travels (skipped under `prefers-reduced-motion`). The icon variant is unchanged.

---

### VisibilityToggle

Eye icon button for showing/hiding sensitive content.

**Import:**

```svelte
<script>
	import { VisibilityToggle } from '@mbsmart/ui/atoms';
</script>
```

**Props:**

| Prop        | Type      | Default  | Description                         |
| ----------- | --------- | -------- | ----------------------------------- |
| `visible`   | `boolean` | `false`  | Current visibility state (bindable) |
| `labelShow` | `string`  | `'Show'` | Tooltip when hidden                 |
| `labelHide` | `string`  | `'Hide'` | Tooltip when visible                |

**Usage:**

```svelte
<script>
	let showPassword = false;
</script>

<input type={showPassword ? 'text' : 'password'} />
<VisibilityToggle bind:visible={showPassword} />
```

---

## Molecules

Composite components built from atoms.

### DeviceCard

Device-focused list item built on top of `ListCard`, with plan and payment badges, device metadata, and optional sync and custom action slots.

**Import:**

```svelte
<script>
	import { DeviceCard } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop                 | Type       | Default        | Description                                                        |
| -------------------- | ---------- | -------------- | ------------------------------------------------------------------ |
| `device`             | `object`   | -              | Device record used to derive labels and metadata                   |
| `href`               | `string`   | `'#'`          | Card link target                                                   |
| `onclick`            | `function` | `null`         | Optional click handler passed to the underlying anchor             |
| `disabled`           | `boolean`  | `false`        | Forces disabled display                                            |
| `disabledTitle`      | `string`   | `''`           | Tooltip text shown when disabled                                   |
| `variant`            | `string`   | `'default'`    | Visual/behavior variant. `'disabled'` also disables the card       |
| `static`             | `boolean`  | `false`        | Renders a non-link row while keeping actions visible               |
| `showArrow`          | `boolean`  | `true`         | Show the trailing chevron on linked cards                          |
| `showOpenInNewTab`   | `boolean`  | `true`         | Show the open-in-new-tab button                                    |
| `openInNewTabHref`   | `string`   | `''`           | Overrides the URL opened by the new-tab button                     |
| `showSyncButton`     | `boolean`  | `false`        | Show the sync action button                                        |
| `showIcon`           | `boolean`  | `true`         | Show the inferred device platform icon                             |
| `showPlanBadge`      | `boolean`  | `true`         | Show the Pro/Basic badge                                           |
| `showPaymentStatus`  | `boolean`  | `true`         | Show the Paid/Unpaid badge when payment status exists              |
| `showDeviceInfo`     | `boolean`  | `true`         | Show the derived device model/info line                            |
| `showLinkcode`       | `boolean`  | `true`         | Show the association/linkcode line derived from `account`          |
| `showNote`           | `boolean`  | `false`        | Show the device note in italic text                                |
| `syncing`            | `boolean`  | `false`        | External loading state for the sync button                         |
| `onSync`             | `function` | `null`         | Async sync handler. Receives the full `device` object              |
| `onSyncStart`        | `function` | `null`         | Called with the derived device id when sync begins                 |
| `onSyncEnd`          | `function` | `null`         | Called with the derived device id when sync finishes               |
| `labels`             | `object`   | `{}`           | Label overrides for built-in copy                                  |
| `actions`            | `snippet`  | -              | Optional trailing actions snippet, rendered before the sync button |

**Recognized device fields:**

- `id` for the secondary identifier line and sync callbacks
- `name` for the main title
- `device_type` or `deviceType` for platform icon selection
- `device_info`, `deviceInfo`, or `deviceModel` for the metadata line
- `is_pro` or `isPro` for the plan badge
- `payment_status` or `paymentStatus` for the payment badge
- `account` for the extra link code line
- `notes` or `note` for the optional note line

**Default labels:**

```javascript
{
	unknownDevice: 'Unknown device',
	pro: 'Pro',
	basic: 'Basic',
	paid: 'Paid',
	unpaid: 'Unpaid',
	syncDevice: 'Sync device',
	notYetSupportedInPortal: 'Not yet supported in portal'
}
```

**Device icons:**

`device_type` values map to these built-in SVG names: `ios` -> `apple-logo`, `android` -> `android-logo`, `mac` -> `mac-logo`, `chrome` -> `chrome-logo`, `windows` -> `windows-logo`. Unknown values fall back to `squircle-dashed`.

**Usage:**

```svelte
<script>
	import { DeviceCard } from '@mbsmart/ui/molecules';

	let device = {
		id: 'A1B2C3',
		name: 'John\'s iPhone',
		device_type: 'ios',
		device_info: 'iPhone 15 Pro',
		is_pro: true,
		payment_status: 'payed',
		account: 'portal--customer-001',
		notes: 'Waiting for next sync'
	};

	async function syncDevice(currentDevice) {
		await refreshDevice(currentDevice.id);
	}
</script>

<DeviceCard
	{device}
	href={`/devices/${device.id}`}
	showNote={true}
	showSyncButton={true}
	onSync={syncDevice}
	labels={{ unpaid: 'Payment due' }}
/>

<!-- Static row with custom actions -->
<DeviceCard
	{device}
	static={true}
	showArrow={false}
	showOpenInNewTab={false}
	actions={() => toolbarSnippet}
/>
```

**Behavior notes:**

- The component derives its disabled state from either `disabled={true}` or `variant="disabled"`.
- The sync button prevents link navigation, manages an internal loading state, and disables itself while syncing.
- The payment badge treats `payment_status === 'payed'` as paid; any other non-empty value is rendered as unpaid.

### Grid

Responsive grid with row-first or column-first flow.

**Import:**

```svelte
<script>
	import { Grid } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop         | Type      | Default | Description                                  |
| ------------ | --------- | ------- | -------------------------------------------- |
| `flow`       | `string`  | `'row'` | `'row'` (standard) or `'col'` (column-first) |
| `itemCount`  | `number`  | `0`     | Required for `'col'` flow                    |
| `columns`    | `number`  | `1`     | Base column count                            |
| `columnsSm`  | `number`  | `null`  | Columns at 640px+                            |
| `columnsSm2` | `number`  | `null`  | Columns at 700px+                            |
| `columnsMd`  | `number`  | `null`  | Columns at 768px+                            |
| `columnsMd2` | `number`  | `null`  | Columns at 850px+                            |
| `columnsLg`  | `number`  | `null`  | Columns at 1024px+                           |
| `columnsLg2` | `number`  | `null`  | Columns at 1150px+                           |
| `columnsXl`  | `number`  | `null`  | Columns at 1280px+                           |
| `columnsXl2` | `number`  | `null`  | Columns at 1440px+                           |
| `columns2Xl` | `number`  | `null`  | Columns at 1536px+                           |
| `columns2Xl2` | `number` | `null`  | Columns at 1650px+                           |
| `columns3Xl` | `number`  | `null`  | Columns at 1920px+                           |
| `columns3Xl2` | `number` | `null`  | Columns at 2100px+                           |
| `gapX`       | `number`  | `2`     | Horizontal gap in rem                        |
| `gapY`       | `number`  | `0`     | Vertical gap in rem                          |
| `disabled`   | `boolean` | `false` | Disable grid (normal flow)                   |
| `className`  | `string`  | `''`    | Additional classes                           |
| `children`   | `snippet` | -       | Grid content                                 |

**Usage:**

```svelte
<!-- Responsive grid -->
<Grid columns={1} columnsSm={2} columnsLg={3} gapX={1} gapY={1}>
	{#each items as item}
		<div>{item.name}</div>
	{/each}
</Grid>

<!-- Column-first flow (fills top-to-bottom first) -->
<Grid flow="col" itemCount={items.length} columns={2}>
	{#each items as item}
		<div>{item.name}</div>
	{/each}
</Grid>
```

---

### HeaderNav

The header's navigation, rendered from data: an icon row on `sm+`, a hamburger menu below it. `AppShell` renders this for you from its `navItems` prop — use it directly only if you are building a header outside `AppShell`.

Taking items as an array rather than a snippet is the point: one source drives both presentations, so the wide row and the narrow menu cannot drift apart, and the menu can show labels that the row hides below `xl`.

**Import:**

```svelte
<script>
	import { HeaderNav } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop        | Type        | Default  | Description                                        |
| ----------- | ----------- | -------- | -------------------------------------------------- |
| `items`     | `NavItem[]` | `[]`     | Nav items; falsy entries are dropped               |
| `menuLabel` | string      | `'Menu'` | Accessible name for the hamburger; pass translated |
| `className` | string      | `''`     | Extra classes for the wide row                     |

**NavItem:**

```javascript
{
  icon: Settings,          // Lucide icon component
  label: 'Settings',       // Visible label; the row hides it below xl, the menu never does
  title: 'My settings',    // Optional tooltip / accessible name when it differs from label
  href: '/settings',       // Link mode
  onclick: () => {},       // Button mode; wins over href
  color: 'azure',          // azure | red | green | gray
  disabled: false,
  items: [ /* NavItem[] */ ]  // Nested group: a NavDropdown in the row, a labelled
                              // section in the menu. One level only.
}
```

**Usage:**

```svelte
<HeaderNav
	menuLabel={$t('nav.menu')}
	items={[
		{ href: '/home', icon: House, label: $t('nav.home') },
		{ onclick: openSettings, icon: Settings, label: $t('nav.settings') },
		{ onclick: logout, icon: LogOut, label: $t('auth.logout'), color: 'red' }
	]}
/>
```

**Behaviour:**

- Below `sm` the row is replaced by one hamburger button (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`).
- The menu closes on item click, outside pointerdown and Escape (via `dismissOnOutside`).
- A nested group becomes a `role="group"` section with the parent's label as its heading — flattened rather than a submenu, because a submenu inside a mobile popover is a trap.
- Disabled items block their `onclick` and suppress link navigation.

---

### Island

Collapsible card container with optional title and icon.

**Import:**

```svelte
<script>
	import { Island } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop              | Type        | Default | Description                      |
| ----------------- | ----------- | ------- | -------------------------------- |
| `title`           | `string`    | `''`    | Header title                     |
| `icon`            | `component` | `null`  | Lucide icon component            |
| `svgIcon`         | `string`    | `''`    | SVG icon name from /static/icons |
| `defaultExpanded` | `boolean`   | `true`  | Initial expanded state           |
| `forceExpanded`   | `boolean`   | `false` | Always expanded, no toggle       |
| `collapsible`     | `boolean`   | `true`  | Enable collapse functionality    |
| `collapseLabel`   | `string`    | `'Collapse'` | Header tooltip when expanded |
| `expandLabel`     | `string`    | `'Expand'`   | Header tooltip when collapsed |
| `className`       | `string`    | `''`    | Additional classes               |
| `scrollBody`      | `boolean`   | `false` | Header and footer stay put and only the content scrolls, with edge fades. Needs a height-bounded flex column parent; use `ModalIsland` rather than setting it by hand |
| `footer`          | `snippet`   | -       | Pinned under the content, for the island's actions |
| `children`        | `snippet`   | -       | Island content                   |

**Accessibility:** the header is a real button carrying `aria-expanded` and
`aria-controls` pointing at the content panel; its accessible name is the
`title` text. Pass `collapseLabel`/`expandLabel` to translate the tooltip.

**Scrolling body (`scrollBody`):** the island becomes a flex column that can
shrink to its parent. The header and `footer` never scroll; the content panel
does, with `overscroll-behavior: contain` so a phone does not carry the scroll
on to the page behind. While there is more content above or below, that edge of
the panel fades out (a `mask-image`, so it is theme-agnostic and never covers a
click target). The fades are driven by two 1px sentinels and an
`IntersectionObserver` rooted on the panel, not by a scroll handler, so they
also follow content that grows, an `{#if}` that opens, and a resize. With no
`title`, a phone-only 2rem strip sits above the panel so the bottom sheet's drag
handle never overlaps the scroller (iOS gives a touch there to the scroller, and
the swipe ends up scrolling the page instead of closing the sheet). Content
needs no top padding of its own to clear the handle.

**Usage:**

```svelte
<script>
	import { User } from '@lucide/svelte';
</script>

<!-- Collapsible with icon -->
<Island title="User Information" icon={User}>
	<p>Content here...</p>
</Island>

<!-- Non-collapsible -->
<Island title="Settings" collapsible={false}>
	<p>Always visible content</p>
</Island>

<!-- Plain container (no header) -->
<Island>
	<p>Simple card</p>
</Island>

<!-- With custom SVG icon -->
<Island title="Device" svgIcon="apple-logo">
	<p>Device content</p>
</Island>
```

---

### ListCard

Reusable list-row primitive for linked, static, or disabled cards with optional icon, actions, trailing arrow, and open-in-new-tab button.

**Import:**

```svelte
<script>
	import { ListCard } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop               | Type       | Default   | Description                                                    |
| ------------------ | ---------- | --------- | -------------------------------------------------------------- |
| `href`             | `string`   | `'#'`     | Link destination when the card is interactive                  |
| `onclick`          | `function` | `null`    | Optional click handler for the interactive anchor              |
| `disabled`         | `boolean`  | `false`   | Render a muted, non-interactive row                            |
| `disabledTitle`    | `string`   | `''`      | Tooltip shown on disabled rows                                 |
| `static`           | `boolean`  | `false`   | Render a non-link row while keeping actions visible            |
| `showArrow`        | `boolean`  | `true`    | Show the trailing chevron on interactive rows                  |
| `showOpenInNewTab` | `boolean`  | `true`    | Show the open-in-new-tab button on static and interactive rows |
| `openInNewTabHref` | `string`   | `''`      | Optional override for the URL opened in a new tab              |
| `icon`             | `snippet`  | -         | Leading visual snippet                                         |
| `actions`          | `snippet`  | -         | Trailing action snippet                                        |
| `children`         | `snippet`  | -         | Main row content                                               |

**Render modes:**

- `disabled={true}` renders a `<div>` with reduced opacity and no actions or new-tab button.
- `static={true}` renders a non-link `<div>` with optional actions and new-tab button.
- The default mode renders an `<a>` with hover styles, optional actions, new-tab button, and optional chevron.

**Usage:**

```svelte
<script>
	import { ListCard } from '@mbsmart/ui/molecules';
	import { Badge } from '@mbsmart/ui/atoms';
</script>

<ListCard href="/devices/A1B2C3">
	{#snippet icon()}
		<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
			D
		</div>
	{/snippet}

	{#snippet children()}
		<p class="font-medium text-gray-900">Device A1B2C3</p>
		<p class="text-sm text-gray-500">Last synced 2 minutes ago</p>
	{/snippet}

	{#snippet actions()}
		<Badge color="green" size="tiny">Active</Badge>
	{/snippet}
</ListCard>

<!-- Disabled row -->
<ListCard disabled={true} disabledTitle="Not available in this portal">
	{#snippet children()}
		<p class="font-medium text-gray-900">Unavailable device</p>
	{/snippet}
</ListCard>
```

**Behavior notes:**

- The new-tab button calls `window.open(resolvedUrl, '_blank')` and stops the row click from firing.
- `openInNewTabHref` falls back to `href` when not provided.
- Interactive rows include `data-sveltekit-reload={true}` on the anchor.

---

### MultiInput

Multi-field form with Edit/Save/Cancel and change tracking.

**Import:**

```svelte
<script>
	import { MultiInput } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop          | Type       | Default          | Description                    |
| ------------- | ---------- | ---------------- | ------------------------------ |
| `fields`      | `array`    | `[]`             | Field configuration array      |
| `initialData` | `object`   | `{}`             | Initial values object          |
| `onSave`      | `function` | `async () => {}` | Async save function            |
| `onUpdate`    | `function` | `() => {}`       | Callback after successful save |

**Field Configuration:**

```javascript
{
  key: 'fieldName',        // Object key
  label: 'Field Label',    // Display label
  type: 'text',            // Input type (text, email, tel, textarea, etc.)
  placeholder: 'Enter...', // Placeholder text
  fullWidth: false,        // Span 2 columns
  rows: 4,                 // For textarea
  hidden: false            // Show masked with visibility toggle
}
```

**onSave Contract:**

- Receives an object with **only changed fields**
- Must return `{ ok: true }` or `{ error: 'message' }`

**Usage:**

```svelte
<script>
	const fields = [
		{ key: 'name', label: 'Name', type: 'text' },
		{ key: 'email', label: 'Email', type: 'email' },
		{ key: 'pin', label: 'PIN', type: 'text', hidden: true },
		{ key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true, rows: 4 }
	];

	const initialData = {
		name: device.name || '',
		email: device.email || '',
		pin: device.pin || '',
		notes: device.notes || ''
	};
</script>

<MultiInput
	{fields}
	{initialData}
	onSave={async (changedFields) => {
		return await updateDevice(changedFields);
	}}
	onUpdate={(newData) => (device = { ...device, ...newData })}
/>
```

---

### Field

Label + hint + inline error wrapper for controls that are not a `TextInput` (a checkbox row, a native select). `TextInput` already owns this surface via its `error` / `label` / `hint` props; do not wrap a labelled `TextInput` in `Field` or the message appears twice.

The error sits **under** the control, never beside the label. Superforms `string[]` errors are reduced to the first message. Children receive the error's id as a snippet argument so the control can set `aria-describedby`.

**Import:**

```svelte
<script>
	import { Field } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop       | Type                 | Default     | Description                                              |
| ---------- | -------------------- | ----------- | -------------------------------------------------------- |
| `label`    | `string`             | `''`        | Optional label above the control                         |
| `error`    | `string \| string[]` | `undefined` | Validation message. Arrays show the first entry only     |
| `hint`     | `string`             | `''`        | Helper text under the control. Hidden while `error` is showing |
| `textInfo` | `string`             | `''`        | Alias for `hint`                                         |
| `children` | `snippet`            | —           | `{#snippet children(describedBy)}` — pass `describedBy` to the control |

**Usage:**

```svelte
<Field label="State" error={errors.state}>
	{#snippet children(describedBy)}
		<select aria-describedby={describedBy} aria-invalid={!!errors.state}>
			<option value="mb_filter">MB Filter</option>
		</select>
	{/snippet}
</Field>
```

---

### NamedControl

Label wrapper for form controls with optional description and info tooltip.

**Import:**

```svelte
<script>
	import { NamedControl } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop            | Type      | Default     | Description                  |
| --------------- | --------- | ----------- | ---------------------------- |
| `label`         | `string`  | `''`        | Main label text              |
| `description`   | `string`  | `''`        | Description text below label |
| `info`          | `boolean` | `false`     | Show info tooltip            |
| `infoLabel`     | `string`  | `''`        | Custom label for info lookup |
| `infoDirectory` | `any`     | `null`      | Custom info directory for i18n |
| `prefix`        | `snippet` | `undefined` | Optional content before label |
| `children`      | `snippet` | `undefined` | Control to render            |

**Accessibility:** the row is a `role="group"` labelled by the visible label
text, so whatever control you drop into the slot inherits that name — a bare
`<ToggleSwitch>` inside a `NamedControl` no longer announces anonymously. Pass a
control-specific `ariaLabel`/`customLabel` as well when the same control repeats
down a list and needs to name its own row (e.g. per-app or per-category rows).

**Usage:**

```svelte
<NamedControl label="Enable Feature" description="Turns on the feature">
  <ToggleSwitch checked={enabled} onChange={(v) => enabled = v} />
</NamedControl>

<!-- With info tooltip -->
<NamedControl label="Device Protection" info={true}>
  <ToggleSwitch checked={protected} onChange={handleProtectionChange} />
</NamedControl>
```

---

### PageHeader

The title block a page with a way out wears: a labelled back pill on its own row, the `<h1>` under it, and an optional quieter line under that. As the page scrolls, a **compact bar** takes over — the pill loses its text, the title comes back beside it a size smaller, pinned under the app header. This is the phone-app idiom, and it works at every width.

It replaced eight hand-spelled copies of the same header across the two portals, which had drifted into two layouts: the technician portal's icon-only button inline with the heading, and the customer portal's stacked labelled pill. Those are now the same component's collapsed and expanded states.

Navigation is left to the host app, exactly as `BackButton` leaves it: `href` for a real anchor, `onback` for programmatic navigation (SvelteKit's `goto`, a language-aware helper), neither for `history.back()`. A router does not belong in this package.

**Import:**

```svelte
<script>
	import { PageHeader } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop            | Type       | Default | Description                                                                     |
| --------------- | ---------- | ------- | ------------------------------------------------------------------------------- |
| `title`         | `string`   | `''`    | The `<h1>`, and the text the compact bar echoes                                 |
| `subtitle`      | `string`   | `''`    | A quieter line under the heading; omitted entirely when empty                   |
| `backLabel`     | `string`   | `''`    | Visible text on the pill. Empty renders the icon-only circle in both states     |
| `backAriaLabel` | `string`   | `''`    | Accessible name for the compact circle; defaults to `backLabel`, then `Go back` |
| `href`          | `string`   | `''`    | Renders the back control as an `<a>`                                            |
| `onback`        | `function` | -       | Click handler; falls back to `history.back()` when omitted                      |
| `sticky`        | `boolean`  | `true`  | `false` drops the compact bar and leaves a plain static header                  |
| `className`     | `string`   | `''`    | Additional CSS classes on the wrapper; this is where page spacing goes          |

**Usage:**

```svelte
<!-- Technician portal: one destination is "wherever you came from" -->
<PageHeader
	title={$t('settings.mySettings')}
	backLabel={$t('common.goBack')}
	onback={() => navigateBack(lang, '/dashboard')}
	className="mb-3 sm:mb-6"
/>

<!-- Customer portal: a fixed destination, so the label can name it -->
<PageHeader
	title={heading}
	{subtitle}
	backLabel={$t('DeviceDetail.back_to_device')}
	href={resolve(deviceManualHref(serie))}
/>
```

**Behaviour:**

- **The compact bar has no height in flow.** It is an overlay inside a zero-height sticky box, so appearing and disappearing never moves the content beneath it. A bar with real height would shove the page up by its own height at the moment it appeared, and that shove can move the trigger back out of range and set the bar flickering.
- **It renders two root elements**, the bar and the header block, because `position: sticky` is confined to its parent box and a wrapper around the header would let the bar travel the header's height and then scroll away. The practical consequence: a parent that is a `flex` column with a `gap` pays that gap for the zero-height bar too, so space the header with `className` rather than a parent gap.
- **A sentinel and an `IntersectionObserver`, not a scroll handler.** The sentinel sits at the bottom of the in-flow block, so the bar arrives exactly as the big title goes under the app header: never a moment with no title, never a moment with two.
- **It reads `--mb-header-h`** to know how far down to pin itself, and sits at `z-10` so it passes under `AppShell`'s header and loading bar (`z-20`). Outside an `AppShell` it falls back to `56px`. The bar is `position: sticky`, so a host that puts this inside an `overflow-auto` region gets a bar pinned to *that* box, not the viewport.
- **The heading truncates rather than wrapping.** A 3xl device name on a phone is what this is for.
- **Both back controls are in the DOM while collapsed**, the compact one first. Tabbing forward reaches the visible one; going on to the scrolled-off original scrolls back up to it, which expands the header and makes the compact copy `inert` again. `inert` is what keeps the hidden state out of the tab order and out of the accessibility tree at once, and the compact bar's title is `aria-hidden` because it is a second rendering of the heading, not a second heading.
- **The bar is still the page, not a card.** No rounding, no blur: it is painted in the page background (`neutral-100` / `zinc-750`) so it reads as the page keeping the title in view, not as a panel sliding over it. The paint is opaque because content has to pass cleanly underneath, so a host that paints its pages some other color gets a strip of that default here. It is a little wider than the column (`-mx-4` / `px-4`) so Island `shadow-lg` does not peek around it, and the shadow is bottom-only (`0 8px 8px -8px`) so it does not bloom out of the sides or the top.
- **`prefers-reduced-motion` drops the transition**, so the bar swaps state without fading.

---

### Tabs

Horizontal tab strip with an active underline and optional per-tab icons. Wraps
onto additional rows when there isn't enough horizontal room, so it degrades
gracefully on narrow / mobile screens.

**Import:**

```svelte
<script>
	import { Tabs } from '@mbsmart/ui/molecules';
</script>
```

**Props:**

| Prop        | Type       | Default  | Description                                                                   |
| ----------- | ---------- | -------- | ----------------------------------------------------------------------------- |
| `tabs`      | `Array`    | `[]`     | Tabs to render: `{ id, label, icon?, color? }`. `icon` is a Lucide component    |
| `active`    | `string`   | -        | Active tab id. Bindable (`bind:active`)                                        |
| `ariaLabel` | `string`   | `'Tabs'` | Accessible name for the strip (`role="group"`)                                  |
| `onChange`  | `function` | `()=>{}` | Called with the selected tab id                                                |

**Colors:**

`tab.color` is one of `azure`, `green`, `yellow`, `orange`, `red`, `gray` — the same
vocabulary as `categoryColors.js` / `SafetyBadge`, so a strip of tabs can carry a
Trusted → Danger scale.

A tab that names a color **stays colored while idle**: the color is the label's
meaning, so greying it out would hide the scale until you clicked through it. The
active tab is marked by its underline and a 10% tint instead, which is why both
states share a text shade.

**Omitting `color` is the plain strip** — gray while idle, azure when active — and
that is what an ordinary tab strip (Settings, Account/Password) wants. Note this is
*not* the same as `color: 'azure'`, which gives you an azure tab that stays azure
while idle, for a strip whose azure means something (MB Filter, say).

**Usage:**

```svelte
<script>
	import { Tabs } from '@mbsmart/ui/molecules';
	import { KeyRound, UserPen } from '@lucide/svelte';

	let active = $state('account');
	const tabs = [
		{ id: 'account', label: 'Account', icon: UserPen },
		{ id: 'password', label: 'Password', icon: KeyRound }
	];

	// Color-coded by risk level
	const safetyTabs = [
		{ id: 'green', label: 'Trusted', color: 'green' },
		{ id: 'orange', label: 'Risk', color: 'orange' },
		{ id: 'red', label: 'Danger', color: 'red' }
	];
</script>

<Tabs {tabs} bind:active />

{#if active === 'account'}
	<!-- account panel -->
{/if}
```

`active` does not have to be one of the tab ids — passing a value no tab matches
(and updating state from `onChange` instead of `bind:active`) renders the strip
with **nothing** selected, which is how the customer portal's app list says "this
search spans every tab".

---

## Organisms

Complex components with significant functionality.

### Modal

Full-screen modal overlay with backdrop.

**Import:**

```svelte
<script>
	import { Modal } from '@mbsmart/ui/organisms';
</script>
```

**Props:**

| Prop              | Type                         | Default    | Description                  |
| ----------------- | ---------------------------- | ---------- | ---------------------------- |
| `isOpen`          | `boolean`                    | `false`    | Controls visibility          |
| `onClose`         | `function`                   | `() => {}` | Close callback               |
| `showCloseButton` | `boolean`                    | `true`     | Show X button                |
| `closeOnBackdrop` | `boolean`                    | `true`     | Close when clicking backdrop |
| `closeOnEscape`   | `boolean`                    | `true`     | Close on ESC key             |
| `verticalAlign`   | `'top' \| 'center' \| 'bottom'` | `'center'` | Vertical placement of the modal |
| `overflowVisible` | `boolean`                    | `false`    | When true, content uses `overflow-visible` so absolutely-positioned dropdowns are not clipped |
| `innerScroll`     | `boolean`                    | `false`    | The dialog stops scrolling and becomes a flex column, so a child with its own scrolling body (`Island scrollBody`) fills it. Takes precedence over `overflowVisible`. `ModalIsland` sets it |
| `minimizable`     | `boolean`                    | `false`    | Show the minimize button and allow the modal to collapse to a corner chip |
| `ariaLabel`       | `string`                     | `''`       | Names the dialog for screen readers — pass the modal's own title |
| `closeLabel`      | `string`                     | `'Close modal'` | Accessible name and tooltip for the X button |
| `minimizeLabel`   | `string`                     | `'Minimize modal'` | Accessible name and tooltip for the minimize button |
| `maximizeLabel`   | `string`                     | `'Restore modal'` | Accessible name and tooltip for the chip's restore button |
| `minimizedLabel`  | `string`                     | `''`       | Text on the minimized chip; falls back to `ariaLabel` |
| `children`        | `snippet`                    | -          | Modal content                |

**Accessibility:** the content container is `role="dialog"` + `aria-modal="true"`,
named by `ariaLabel`. Always pass `ariaLabel` (and a translated `closeLabel`);
give the button that opens the modal `aria-haspopup="dialog"`. The mobile
swipe-to-dismiss handle is `aria-hidden` — Escape and the close button cover
keyboard and assistive tech.

**Usage:**

```svelte
<script>
	let isOpen = false;
</script>

<button onclick={() => (isOpen = true)} aria-haspopup="dialog">Open Modal</button>

<!-- One island in a modal: use ModalIsland (below), not this -->
<Modal {isOpen} onClose={() => (isOpen = false)} ariaLabel="Modal Title">
	<section class="flex flex-col gap-4">
		<Island title="First">...</Island>
		<Island title="Second">...</Island>
	</section>
</Modal>

<!-- Dropdowns that escape the modal box -->
<Modal {isOpen} onClose={() => (isOpen = false)} overflowVisible>
	<!-- custom select / absolute menus -->
</Modal>

<!-- Parkable in the corner while the user works on the page -->
<ModalIsland
	{isOpen}
	onClose={() => (isOpen = false)}
	minimizable
	title={$t('device.note')}
	closeLabel={$t('common.close')}
	minimizeLabel={$t('common.minimize')}
	maximizeLabel={$t('common.restore')}
>
	<!-- ... -->
</ModalIsland>
```

**Behaviour:**

On small screens the modal renders as a bottom sheet with a grab handle. Dragging
the handle down (pointer events — touch or mouse, with pointer capture so the drag
survives leaving the handle) dismisses it when it passes ~28% of the sheet height
**or** on a fast downward flick; otherwise it snaps back. Dismissal animates the
sheet off-screen before `onClose` fires, rather than closing instantly.

**Minimizing (`minimizable`, sm+):** a `Minus` button sits next to the close
button — modal-level, so it is in the same place whatever the content is, and it
takes the trailing corner itself when `showCloseButton` is `false`. Minimizing
flies the dialog into the **bottom-leading corner** (bottom-left, bottom-right
under RTL) over 300ms and crossfades in a chip carrying `minimizedLabel ||
ariaLabel`, a restore button (`SquareArrowOutUpRight`, mirrored to
`SquareArrowOutUpLeft` under RTL) and, when `showCloseButton` is set, a close
button, and wearing a 2px `azure-500` / `azure-400` border so it reads against
whatever it is sitting on top of. Several minimized modals **stack upwards** in
that corner in the order they were minimized, and the stack closes up — with
animation — when one of them is restored or closed.

**Exactly one modal is maximized at a time.** Restoring one sends every other
open, minimizable modal to the corner, so a chip can be clicked while another
modal is up and the two swap places. A modal without `minimizable` cannot be
sent down and is left alone.

While minimized:

- **the backdrop goes away** (`bg-transparent` + `pointer-events-none`) so the
  page underneath is fully usable, and the dialog is `inert`, `opacity-0` and
  `pointer-events-none`;
- **the wrapper moves to `z-60`** (from `z-50`), which is what keeps the chips
  above the dimmed backdrop of whichever modal is currently up — the wrapper is
  the stacking context, so raising the chip alone would not do it;
- **the dialog stays mounted**, so form state, scroll position and any in-flight
  work survive — minimize is not a close;
- **Escape and the Tab trap are off**, `aria-modal` is `false`, and focus moves to
  the chip's restore button on the way down and back into the dialog on the way
  up.

The order of the stack is shared state, in
[`minimizedModals`](#minimizedmodals) — each `Modal` knows only its own slot.

**Window listeners exist only while the modal is open** (minimized counts as open).
The Escape/Tab `keydown` handler and the viewport size the chip position is computed
from are attached on open and removed on close. Closed modals stay mounted across the
portals, so binding them for a modal's whole life added a `keydown` handler and two
state writes per resize for every closed one on the page.

---

### ModalIsland

A `Modal` holding one `Island`, which is the shape nearly every dialog in the portals
takes. The island's title bar and `footer` stay put while only its content scrolls,
with a fade at whichever edge has more to see. **Use it for any single-island
dialog** instead of spelling `Modal` + `Island` by hand.

**Import:**

```svelte
<script>
	import { ModalIsland } from '@mbsmart/ui/organisms';
</script>
```

**Props:**

| Prop        | Type        | Default | Description |
| ----------- | ----------- | ------- | ----------- |
| `title`     | `string`    | `''`    | Island title. No title means no header; the whole island scrolls |
| `icon`      | `component` | `null`  | Lucide icon for the title |
| `svgIcon`   | `string`    | `''`    | SVG icon name, instead of `icon` |
| `ariaLabel` | `string`    | `''`    | Dialog name; falls back to `title`. Pass it when there is no title |
| `footer`    | `snippet`   | -       | Actions pinned under the scrolling content |
| `children`  | `snippet`   | -       | Island content |
| *anything else* |         |         | Passed to `Modal` unchanged: `isOpen`, `onClose`, `minimizable`, `verticalAlign`, `showCloseButton`, the labels |

**Usage:**

```svelte
<ModalIsland
	{isOpen}
	{onClose}
	title={$t('device.appTimerTitle')}
	icon={Timer}
	closeLabel={$t('common.close')}
>
	<MinutesInput bind:value={minutes} label={$t('device.pauseForMinutes')} />

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<ControlButton onclick={save} color="orange" size="md">{$t('device.setTimer')}</ControlButton>
		</div>
	{/snippet}
</ModalIsland>
```

**Behaviour:**

- The island is always `collapsible={false}` with the bottom-sheet corners
  (`rounded-b-none sm:rounded-b-xl`); callers do not pass either.
- Put the dialog's main action row in `footer` so it stays reachable on a short
  screen. Buttons that belong to one branch of the content (a step, an error
  state) can stay in the body.
- The content panel scrolls, so an absolutely positioned popover inside it is
  clipped at the panel's edges. Native `<select>` and `OneFromMany` are fine.
  A dialog that needs a menu to escape uses `Modal` with `overflowVisible`.
- It is thin on purpose. A dialog with two islands, or content beside the
  island, uses `Modal` and `Island` directly; do not grow props here for it.

---

### QuickLinks

Grid of quick link cards with icons.

**Import:**

```svelte
<script>
	import { QuickLinks } from '@mbsmart/ui/organisms';
</script>
```

**Props:**

| Prop          | Type     | Default                           | Description         |
| ------------- | -------- | --------------------------------- | ------------------- |
| `gridClasses` | `string` | `'sm:grid-cols-2 lg:grid-cols-3'` | Grid column classes |
| `title`       | `string` | `'Quick Links'`                   | Island title        |
| `links`       | `array`  | `null`                            | Translated links; falls back to the English defaults |
| `scrollBody`  | `boolean`| `false`                           | Set when shown in a `Modal` with `innerScroll`, so the title stays put and the links scroll |

**Usage:**

```svelte
<QuickLinks />

<QuickLinks gridClasses="sm:grid-cols-1 lg:grid-cols-2" />
```

**Built-in Links:**

- Wiki Docs
- Training by MB
- Training by TAG
- 2-Factor Authentication
- Downloads
- Old Portal

---

### SearchableList

Searchable, filterable list with optional bulk selection.

**Import:**

```svelte
<script>
	import { SearchableList } from '@mbsmart/ui/organisms';
</script>
```

**Props:**

| Prop                | Type      | Default            | Description                      |
| ------------------- | --------- | ------------------ | -------------------------------- |
| `title`             | `string`  | `'Items'`          | List title                       |
| `items`             | `array`   | `[]`               | Array of items                   |
| `searchKeys`        | `array`   | `[]`               | Object paths to search in        |
| `searchPlaceholder` | `string`  | `'Search...'`      | Placeholder text                 |
| `searchThreshold`   | `number`  | `0`                | Hide search input until `items.length` reaches this count (`0` = always show) |
| `specialFilters`    | `object`  | `{}`               | Special keyword filters          |
| `emptyMessage`      | `string`  | `'No items found'` | Empty state message              |
| `itemName`          | `string`  | `'item'`           | Singular item name               |
| `filterTabs`        | `array`   | `[]`               | Tab filter definitions           |
| `columns`           | `number`  | `1`                | Grid columns (base; the grid itself starts at 640px) |
| `columnsSm`         | `number`  | `null`             | Columns at 640px+                |
| `columnsSm2`        | `number`  | `null`             | Columns at 700px+                |
| `columnsMd`         | `number`  | `null`             | Columns at 768px+                |
| `columnsMd2`        | `number`  | `null`             | Columns at 850px+                |
| `columnsLg`         | `number`  | `null`             | Columns at 1024px+               |
| `columnsLg2`        | `number`  | `null`             | Columns at 1150px+               |
| `columnsXl`         | `number`  | `1`                | Columns at 1280px+               |
| `columnsXl2`        | `number`  | `1`                | Columns at 1440px+               |
| `columns2Xl`        | `number`  | `2`                | Columns at 1536px+               |
| `columns2Xl2`       | `number`  | `null`             | Columns at 1650px+               |
| `columns3Xl`        | `number`  | `null`             | Columns at 1920px+               |
| `columns3Xl2`       | `number`  | `null`             | Columns at 2100px+               |
| `disableGrid`       | `boolean` | `false`            | Use normal flow                  |
| `searchActions`     | `snippet` | `undefined`        | Optional actions next to search  |
| `children`          | `snippet` | -                  | Item render function             |
| `bulk`              | `boolean` | `false`            | Enable bulk selection            |
| `selected`          | `array`   | `[]`               | Selected item IDs (bindable)     |
| `selectedItems`     | `array`   | `[]`               | Selected item objects (bindable) |
| `selectId`          | `string`  | `'id'`             | Path to item ID                  |
| `idKey`             | `string`  | `null`             | Key for #each block              |
| `pageSize`          | `number`  | `28`               | Items per page (0 = no pagination) |
| `externalQuery`     | `string`  | `''`               | Supplied search query from outside (e.g. SectionedPage magic search). Filters rows for **item** hits. |
| `containerTerms`    | `string`  | `''`               | The enclosing island's `data-magicsearch` string. When `externalQuery` matches these terms, rows are **not** filtered — the island itself is the hit. Omit to fall back to the closest `.magicsearch-island` after mount. |
| `searchQuery`       | `string`  | `''`               | The built-in search box's text. Bindable — a parent can read what is being searched for (e.g. to widen `items` beyond the category it is showing while a query is active) or clear it |
| `ofText`            | `string`  | `'of'`             | i18n "of" text                   |
| `selectedText`      | `string`  | `'selected'`       | i18n "selected" text             |
| `pageText`          | `string`  | `'Page'`           | i18n "Page" label                |
| `prevText`          | `string`  | `'Previous'`       | i18n aria-label for prev button  |
| `nextText`          | `string`  | `'Next'`           | i18n aria-label for next button  |
| `showAllText`       | `string`  | `'Show all'`       | i18n label for the "show all" link that bypasses pagination |
| `paginateText`      | `string`  | `'Paginate'`       | i18n label for the button that returns to paginated view when all items are shown |
| `formatAllCount`    | `function`| `null`             | Optional `(count) => string \| null`, called with the total item count. Only applies while every item is visible (nothing hidden by search, tabs, or pagination); a non-empty string then becomes the entire count line. Return null/undefined/'' to keep the default forms. |
| `showResultsCount`  | `boolean` | `true`             | When `false`, the built-in results count line is omitted (parent can render its own). |

**Column behavior:**

- Every stop is forwarded straight to [`Grid`](#grid), and a stop left `null` inherits the one below it. `columns` is the base, but the grid only exists from 640px up — below that `Grid` falls back to normal flow, so a phone always gets one item per row.
- `columnsXl`, `columnsXl2` and `columns2Xl` are **not** `null` by default (`1`, `1`, `2`). A ramp that only sets a lower stop therefore collapses again higher up — `columnsLg={2}` alone drops back to one column at 1280px. Spell out every stop from the first one you set upwards.
- The `3xl` stops exist for the third column. Place it where the columns stay as wide as they were when the second one appeared: one more column costs one more column's width, so a list that splits in two at 1440px has room for a third around 1920px, and one that splits at 1536px around 2100px. Going earlier just makes every column narrower than the layout already decided it wanted to be.

**Results count behavior:**

- The count line shows the `X of Y` form (e.g. `10 of 42 Devices`) only while the current page hides some of the filtered results.
- When every filtered item fits on the current page, the `of` clause is dropped and it reads `Y Devices` (e.g. `1 Device`), since `1 of 1` carries no extra information.
- Pass `formatAllCount` to replace the whole count line with a custom phrase (e.g. `"You have {count} devices"`). It only kicks in while the full list is on screen at a glance; once search, tabs, or pagination hide items, the default forms above take over.
- Pass `showResultsCount={false}` when the parent owns the count line entirely.

**Show-all behavior:**

- The pagination controls include a `Show all` link (controlled by `showAllText`) that, when clicked, bypasses pagination and displays all currently filtered items.
- While showing all items the pagination controls collapse to a single button labeled by `paginateText` which returns the list to the paginated view.
- The `showAll` state resets to `false` whenever the search query or active filter changes, so pagination is the default on navigation/hydration.

**filterTabs Format:**

```javascript
[
	{ key: 'all', label: 'All', filterFn: () => true },
	{ key: 'active', label: 'Active', filterFn: (item) => item.active }
];
```

**specialFilters Format:**

```javascript
{
  'open': { path: 'status', value: 'open' },
  'closed': { path: 'status', value: 'closed' }
}
```

**Usage:**

```svelte
<SearchableList
	items={apps}
	searchKeys={['name', 'package']}
	searchPlaceholder="Search apps..."
	itemName="app"
	filterTabs={[
		{ key: 'all', label: 'All', filterFn: () => true },
		{ key: 'blocked', label: 'Blocked', filterFn: (app) => app.status === 'blocked' }
	]}
	specialFilters={{
		open: { path: 'request_status', value: 'open' }
	}}
>
	{#snippet children(app, activeFilter)}
		<div class="rounded border p-2">
			{app.name}
		</div>
	{/snippet}
</SearchableList>

<!-- With bulk selection -->
<SearchableList
	{items}
	searchKeys={['name']}
	bulk={true}
	bind:selected={selectedIds}
	bind:selectedItems={selectedObjects}
>
	{#snippet children(item)}
		<span>{item.name}</span>
	{/snippet}
</SearchableList>
```

**With pagination:**

```svelte
<SearchableList
	{items}
	searchKeys={['name']}
	itemName="item"
	pageSize={20}
>
	{#snippet children(item)}
		<span>{item.name}</span>
	{/snippet}
</SearchableList>
```

**Magic Search Integration:**

Pass `ctx.magicSearchQuery` as `externalQuery` so SectionedPage's magic search can filter **rows** (an app name, a URL). That JS pass is what finds a hit pagination has not rendered; CSS can only see the current page. Pagination, tab filters, and `specialFilters` keep working.

When the **island** matches the query, the list must not filter. CSS already shows every child of a matching island (`magicsearch-island-match`); emptying the list would make that island look like it had no rows. Pass `containerTerms` — the same string as the island's `data-magicsearch` — so the first frame is already correct. If it is omitted, the list reads the closest `.magicsearch-island` after mount. The built-in search box still filters if someone types in it. Do not mount the full unpaginated list for CSS to scan.

```svelte
{#snippet sectionContent(ctx)}
	<div class="magicsearch-island" data-magicsearch={islandTerms}>
		<Island title="Installed Apps">
			<SearchableList
				{items}
				searchKeys={['name', 'package']}
				externalQuery={ctx.magicSearchQuery}
				containerTerms={islandTerms}
			>
				{#snippet children(item)}
					<span>{item.name}</span>
				{/snippet}
			</SearchableList>
		</Island>
	</div>
{/snippet}
```

---

### TermsContent

The MB Smart Terms & Conditions body (MB SMART FILTERING LLC) — the estate-wide
single source of truth for that document. Anything that has to show the Terms
renders this; nothing re-authors them.

**Import:**

```svelte
<script>
	import { TermsContent } from '@mbsmart/ui/organisms';
</script>
```

**Props:** none.

**Usage:**

```svelte
<script>
	import { TermsContent, legalProse, TERMS_LAST_UPDATED } from '@mbsmart/ui';
</script>

<h2 class={legalProse.title}>Terms of Service Agreement</h2>
<p class={legalProse.revised}><em>Last updated: {TERMS_LAST_UPDATED}</em></p>

<!-- The document's first heading is `first:mt-0`, so the gap above it
     belongs to whichever surface is introducing it. -->
<div class="mt-8">
	<TermsContent />
</div>
```

**Behaviour:**

- **Renders the body only** — no title, no revision line, no chrome. Each surface
  frames it differently (a public page with a sidebar TOC, a modal, an
  acceptance gate with a scroll sentinel), so the frame is the host's.
- **English-only and forced `dir="ltr"`**, regardless of the host app's active
  language. The Terms are kept in English and must not be translated or
  mirrored. Telling a non-English reader so is the host's job —
  `customer-portal-svelte` renders `LegalLanguageNotice` above it.
- **Section headings carry stable `id`s** (`acceptance`, `use-of-software`,
  `intellectual-property`, `software-function`, `privacy`, `liability`,
  `miscellaneous`) for in-page anchors. A host with a table of contents links to
  those; changing one breaks every deep link into the document.
- **Styling comes from [`legal`](#legal)**, not from props. There is no variant
  and no size prop.

---

### ToastContainer

Container component for displaying toast notifications.

**Import:**

```svelte
<script>
	import { ToastContainer } from '@mbsmart/ui/organisms';
</script>
```

**Usage:**

Add once in your root layout:

```svelte
<!-- +layout.svelte -->
<script>
	import { ToastContainer } from '@mbsmart/ui/organisms';
</script>

<ToastContainer />
{@render children()}
```

Then use the `toast` utility anywhere:

```svelte
<script>
	import { toast } from '@mbsmart/ui/utils';

	function handleSave() {
		toast.success('Saved successfully!');
	}
</script>
```

---

## Templates

Full page layout components.

### ErrorPage

Full-screen error page template with status code, message, bundled light/dark images, and a customisable action button via a snippet. Default images are included in the library; override with your own via `darkImage` / `lightImage` props.

**Import:**

```svelte
<script>
	import { ErrorPage } from '@mbsmart/ui/templates';
</script>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `statusCode` | `number` | `404` | HTTP status code displayed as a heading |
| `message` | `string` | `''` | Error message shown below the status code |
| `darkImage` | `string` | bundled image | Image path/URL shown in dark mode |
| `lightImage` | `string` | bundled image | Image path/URL shown in light mode |
| `imageAlt` | `string` | `''` | Alt text for the images |

**Snippets:**

| Snippet | Description |
|---------|-------------|
| `action` | Custom action button (e.g. "Back to Dashboard") |

**Usage:**

```svelte
<!-- Minimal — uses bundled images -->
<ErrorPage statusCode={404} message="Page not found">
	{#snippet action()}
		<ControlButton onclick={goHome} color="azure" size="lg">
			Back to Dashboard
		</ControlButton>
	{/snippet}
</ErrorPage>

<!-- Custom images -->
<ErrorPage
	statusCode={500}
	message="Something went wrong"
	darkImage="/my-dark-error.png"
	lightImage="/my-light-error.png"
>
	{#snippet action()}
		<a href="/">Go home</a>
	{/snippet}
</ErrorPage>
```

**Only one image is downloaded in the browser.** It renders the image for the scheme
on screen, read from [`paintedDark`](#theme), rather than a `dark:hidden` pair (a hidden
`<img>` is still fetched). The server cannot know the scheme, so a server-rendered error
page keeps both images behind CSS and hydration swaps in the single one.

---

### SectionedPage

Complex page template with sidebar navigation, magic search, and section content.

**Import:**

```svelte
<script>
	import { SectionedPage } from '@mbsmart/ui/templates';
</script>
```

---

### AppShell

Full page layout template: sticky header, loading progress bar, main content area, and a faded brand footer.

**The header is identity, the footer is product.** The header carries the signed-in account (avatar + name) and the nav; the product name ("MB Smart Filtering", "MB Smart Technician") lives in the footer with the version, the way a copyright line does. Do not pass a product name as `userName` — that conflation is what made the two portals' headers mean different things.

**It publishes `--mb-header-h`** (`56px`, the header's own `h-14`) on its wrapper, so anything pinning itself under the header can read the offset instead of guessing it. [PageHeader](#pageheader) is the one consumer today. The header and the loading bar both sit at `z-20`; anything pinned beneath them belongs below that.

**Import:**

```svelte
<script>
	import { AppShell } from '@mbsmart/ui/templates';
	import { LogOut, Settings, UserRoundPlus } from '@lucide/svelte';
</script>
```

**Props:**

| Prop              | Type       | Default        | Description                                                        |
| ----------------- | ---------- | -------------- | ------------------------------------------------------------------ |
| `userName`        | string     | `''`           | Signed-in account, shown beside the avatar (e.g. `tagintl`, a name) |
| `userHref`        | string     | `/dashboard`   | Where the account chip links — normally the dashboard              |
| `homeLabel`       | string     | `'Home'`       | Accessible name for the chip link; pass a translated string        |
| `navItems`        | `NavItem[]`| `[]`           | Nav, rendered as an icon row on `sm+` and a hamburger below it (see [HeaderNav](#headernav)) |
| `menuLabel`       | string     | `'Menu'`       | Accessible name for the hamburger; pass a translated string        |
| `productName`     | string     | `''`           | Product name in the footer. Empty hides the footer entirely        |
| `brandIcon`       | string     | `mbsmart-logo` | Footer icon name for `SvgIcon`                                     |
| `versionString`   | string     | `''`           | Version, appended to the product name after a `·`                  |
| `loadingProgress` | number     | `0`            | Loading bar progress percentage (0-100)                            |
| `isFullyLoaded`   | boolean    | `true`         | When true, hides the loading bar                                   |
| `className`       | string     | `''`           | Additional CSS classes for wrapper                                 |
| `headerContent`   | snippet    | -              | Header content that must stay visible at every width (e.g. search) |
| `children`        | snippet    | -              | Main page content                                                  |

**Usage:**

```svelte
<AppShell
	userName={userId}
	userHref="/{lang}/dashboard"
	homeLabel={$t('nav.home')}
	productName="MB Smart Technician"
	versionString={VERSION_STRING}
	menuLabel={$t('nav.menu')}
	navItems={[
		{ icon: Wrench, label: $t('nav.tools'), items: [
			{ href: `/${lang}/dashboard/device/new`, icon: UserRoundPlus, label: $t('nav.newDevice') },
			{ href: `/${lang}/dashboard/customers`, icon: Users, label: $t('customers.title') }
		] },
		{ href: `/${lang}/dashboard/settings`, icon: Settings, label: $t('nav.settings') },
		{ onclick: logout, icon: LogOut, label: $t('auth.logout'), color: 'red' }
	]}
	loadingProgress={75}
	isFullyLoaded={false}
>
	{#snippet headerContent()}
		<!-- Stays in the bar at every width, beside the hamburger -->
		<SearchButton />
	{/snippet}

	<div class="p-4">
		<h1>Dashboard</h1>
	</div>
</AppShell>
```

**Features:**

- Full page layout with `min-h-screen` and neutral background
- Sticky header (`sticky top-0 z-20`) with shadow
- Account chip: `Avatar` + name, one link to `userHref`, shared hover — circle, glyph and name all move together, **lightening** in dark mode and darkening in light, and the name takes the same hover shade as the glyph
- Nav collapses to a hamburger below `sm`, where labels become visible
- Loading progress bar below header (sticky, animates)
- Faded brand footer, in-flow after `<main>` — it sits at the bottom on short pages and scrolls away on long ones

**Notes:**

- `headerContent` is for controls that must never hide behind the hamburger. Everything else belongs in `navItems`, so one array drives both presentations.
- The footer is `select-none` and rendered at 40% / 35% opacity (light / dark). It is deliberately quiet; do not brighten it to make it "readable".
- No `productName` means no footer element at all.
- Loading bar automatically hides when `isFullyLoaded` is true

---


**Props:**

| Prop              | Type       | Default    | Description                  |
| ----------------- | ---------- | ---------- | ---------------------------- |
| `sections`        | `array`    | `[]`       | Section definitions          |
| `navActions`      | `array`    | `[]`       | Navigation action buttons    |
| `loading`         | `boolean`  | `false`    | Show loading state           |
| `error`           | `string`   | `''`       | Error message                |
| `onRetry`         | `function` | `() => {}` | Retry button handler         |
| `overflowMenuTitle` | `string` | `'More'` | Title for the mobile overflow menu |
| `defaultIslandsExpanded` | `boolean` | `true` | Initial expanded state for all Islands rendered via `ctx.islandProps`. Captured on mount; users can still toggle expand/collapse all afterwards. |
| `hotkeysEnabled`  | `boolean`  | `true`     | Master switch for the keyboard shortcuts (`Alt+Shift+{letter}` section nav, double-tap `CC`) and their `Kbd` hint badges. Set `false` to disable all shortcuts and hide the hints — magic search still works by clicking/typing into the input, and per-section `shortcut` badges are suppressed. |
| `magicSearchEnabled` | `boolean` | `true`  | Master switch for magic search. Set `false` to hide the search input, its `Kbd`/clear hints and the no-results message, and to stop bare-key typing from feeding the search. Section tabs and the collapse/expand-all control stay, and the collapse control right-aligns in place of the input. Independent of `hotkeysEnabled` (double-tap `CC` still toggles all islands). |
| `collapseAllEnabled` | `boolean` | `true`  | Master switch for the collapse/expand-all control. Set `false` to hide the collapse-all button and stop the double-tap `CC` hotkey from toggling all islands. Individual islands still collapse via their own headers. |
| `header`          | `snippet`  | -          | Header content               |
| `sidebarSkeleton` | `snippet`  | -          | Loading skeleton for sidebar |
| `mainSkeleton`    | `snippet`  | -          | Loading skeleton for main    |
| `sectionContent`  | `snippet`  | -          | Section content renderer     |

**Section Definition:**

```javascript
{
  key: 'info',          // Unique key (used in URL hash)
  name: 'Information',  // Display name
  icon: User,           // Lucide icon component
  svgIcon: 'custom',    // OR custom SVG icon name
  shortcut: 'I',        // Alt+Shift+{key} shortcut
  advanced: false,      // Show "advanced" label
  unimportant: false    // When true, hidden from mobile bottom bar and tucked into overflow menu
}
```

**navActions Definition:**

```javascript
{
  label: 'Action Name',
  title: 'Tooltip text',
  icon: Star,           // Lucide icon
  onclick: () => {}     // Click handler
}
```

**sectionContent Context:**
The `sectionContent` snippet receives a context object with:

```javascript
{
  activeSection,        // Current section key
  magicSearchActive,    // Boolean: is magic search active
  magicSearchQuery,     // Current search query
  allIslandsExpanded,   // Boolean: default island state
  islandResetKey,       // Key to force island re-render

  // Helper functions:
  isVisible(sectionKey),           // Returns true if section should show
  isVisibleMulti(...sectionKeys),  // Returns true if any key matches

  // Props for Island components:
  islandProps: { defaultExpanded, forceExpanded }
}
```

**Keyboard Shortcuts:** (all gated behind `hotkeysEnabled`, which defaults to `true`)

- `Alt+Shift+{letter}`: Navigate to section
- `CC` (double-tap C): Toggle expand/collapse all (only when `collapseAllEnabled`)
- `ESC`: Clear magic search (when focused — always available, independent of `hotkeysEnabled`)

Pass `hotkeysEnabled={false}` to disable all of the above and hide their `Kbd` hint badges. Magic search remains fully usable via clicking or typing into the search input; only the shortcut affordances are removed.

**Disabling magic search:** Pass `magicSearchEnabled={false}` to remove the search entirely — the input, its hints, and the no-results message are hidden, and typing (bare keys) no longer feeds the search. The section tabs and the collapse/expand-all control remain fully functional. The magic-search text props (`magicSearchPlaceholder`, `magicSearchNoResultsPrefix`, `magicSearchNoResultsSuffix`, `disabledDuringSearchTitle`) become unused and can be omitted.

**Disabling collapse-all:** Pass `collapseAllEnabled={false}` to remove the collapse/expand-all button and disable the double-tap `CC` hotkey. Individual islands still collapse via their own headers, and the `collapseAllSectionsTitle`/`expandAllSectionsTitle` props become unused and can be omitted.

**Usage:**

```svelte
<script>
	import { SectionedPage } from '@mbsmart/ui/templates';
	import { Island } from '@mbsmart/ui/molecules';
	import { User, Settings, Star } from '@lucide/svelte';

	const sections = [
		{ key: 'info', name: 'Information', icon: User, shortcut: 'I' },
		{ key: 'settings', name: 'Settings', icon: Settings, shortcut: 'S' },
		{ key: 'advanced', name: 'Advanced', icon: Star, shortcut: 'A', unimportant: true }
	];

	const navActions = [{ label: 'Presets', icon: Star, onclick: openPresets }];
</script>

<SectionedPage {sections} {navActions} loading={isLoading} error={errorMessage} onRetry={loadData}>
	{#snippet header()}
		<h1>Page Title</h1>
	{/snippet}

	{#snippet sidebarSkeleton()}
		<Skeleton height="h-48" />
	{/snippet}

	{#snippet mainSkeleton()}
		<Skeleton rows={['h-8', 'h-32', 'h-32']} />
	{/snippet}

	{#snippet sectionContent(ctx)}
		<!-- Use ctx.isVisible() to show/hide sections -->
		{#if ctx.isVisible('info')}
			<Island title="User Info" {...ctx.islandProps}>
				<p>Info content</p>
			</Island>
		{/if}

		{#if ctx.isVisible('settings')}
			<Island title="Settings" {...ctx.islandProps}>
				<p>Settings content</p>
			</Island>
		{/if}
	{/snippet}
</SectionedPage>
```

**Magic Search:**
The template includes a "magic search" that searches across all elements with `data-magicsearch` attributes. An island whose own terms match the query gets `magicsearch-island-match` and CSS shows every `.magicsearch-item` inside it. Lists that also take `externalQuery` must pass `containerTerms` (see SearchableList) so they do not JS-filter those rows away.

```svelte
<!-- Elements will be filtered by magic search -->
<div data-magicsearch="user info name email" class="magicsearch-item">Content here</div>

<!-- Islands should have magicsearch-island class -->
<div data-magicsearch="settings preferences" class="magicsearch-island">
	<Island title="Settings">...</Island>
</div>
```

**Mobile Overflow Menu:**

On small screens (`< sm:`), the bottom navigation bar only shows "important" section tabs (those without `unimportant: true`). Section names appear under each icon (in normal document flow so they reserve height and are not clipped), with the active section name bolded. The same under-icon labels appear in the narrow `sm`–`lg` sidebar until the full inline label shows at `lg+`.

An ellipsis (`...`) button appears at the end of the bottom bar when there are overflow items. Tapping it opens a bottom-sheet Modal listing:
- **Unimportant sections** — section tabs marked with `unimportant: true`
- **Nav actions** — all `navActions` buttons (these are always hidden from the mobile bottom bar)

On `sm:` and above, the sidebar shows all sections and nav actions as normal — the overflow menu is mobile-only.

---

## Utilities

Helper functions and stores.

### categoryColors

Category-to-color mapping utilities for risk level display.

**Import:**

```javascript
import {
	deriveColorKeyFromLabel,
	getRiskLabel,
	getColorClasses,
	normalizeLabel,
	labelToColorKey,
	riskLabelMap,
	colorClasses
} from '@mbsmart/ui/utils';
```

**Functions:**

#### `deriveColorKeyFromLabel(label)`

Derives a color key from a category label.

```javascript
deriveColorKeyFromLabel('Games'); // 'orange'
deriveColorKeyFromLabel('Banks'); // 'green'
deriveColorKeyFromLabel('Unknown'); // 'gray'
```

#### `getRiskLabel(colorKey)`

Gets the risk label for a color key.

```javascript
getRiskLabel('green'); // 'Trusted'
getRiskLabel('yellow'); // 'Caution'
getRiskLabel('orange'); // 'Risk'
getRiskLabel('red'); // 'Danger'
getRiskLabel('gray'); // 'Unknown'
```

#### `getColorClasses(colorKey)`

Gets TailwindCSS classes for a color key.

```javascript
getColorClasses('green');
// 'border-green-alt-500 bg-green-alt-500/5 text-green-alt-500'
```

#### `normalizeLabel(label)`

Normalizes category labels for display (handles API quirks).

```javascript
normalizeLabel('socialmedia'); // 'Social Media'
```

**Color Mappings:**

| Category                                          | Color Key |
| ------------------------------------------------- | --------- |
| tools, banks, torah, jewish, technology, business | green     |
| travel, safe shopping, information, health, jobs  | yellow    |
| games, shopping, news, media, browsers            | orange    |
| social media, mature, proxies, entertainment      | red       |

---

### dateTime

Date formatting and relative time utilities.

**Import:**

```javascript
import {
	parseDate,
	isZeroDate,
	formatDate,
	formatDateTime,
	formatDateShort,
	getRelativeTime,
	getTimeElapsed,
	formatBillingDate
} from '@mbsmart/ui/utils';
```

**Functions:**

#### `parseDate(dateStr)`

Parses date strings in various formats.

```javascript
parseDate('2026-01-22 14:30:00'); // Date object
parseDate('2026-01-22T14:30:00'); // Date object
parseDate('invalid'); // null
```

#### `isZeroDate(dateStr)`

Checks if a date is a "zero" placeholder.

```javascript
isZeroDate('0000-00-00 00:00:00'); // true
isZeroDate('2026-01-22'); // false
```

#### `formatDate(dateStr, options?)`

Formats a date for display.

```javascript
formatDate('2026-01-22'); // 'January 22, 2026'
formatDate('2026-01-22', { month: 'short' }); // 'Jan 22, 2026'
```

#### `formatDateTime(dateStr)`

Formats date with time.

```javascript
formatDateTime('2026-01-22 14:30:00'); // 'January 22, 2026, 2:30 PM'
```

#### `formatDateShort(dateStr)`

Short date format.

```javascript
formatDateShort('2026-01-22'); // 'Jan 22, 2026'
```

#### `getRelativeTime(dateStr)`

Gets relative time string.

```javascript
getRelativeTime(futureDate); // 'in 3 days'
getRelativeTime(pastDate); // '2 weeks ago'
```

#### `getTimeElapsed(dateStr)`

Gets elapsed time (always past tense, more granular).

```javascript
getTimeElapsed(recentDate); // '5 minutes ago'
getTimeElapsed(oldDate); // '3 months ago'
```

---

### dismiss

Close-on-outside-interaction wiring for popovers, dropdowns and menus. Used by `NavDropdown` and `HeaderNav`.

```javascript
import { dismissOnOutside } from '@mbsmart/ui/utils';
```

**`dismissOnOutside(getElement, close)`**

| Param        | Type                 | Description                          |
| ------------ | -------------------- | ------------------------------------ |
| `getElement` | `() => Element｜null` | Returns the surface's root node      |
| `close`      | `() => void`         | Called on outside pointerdown or Esc |

Returns a teardown that removes both listeners.

```javascript
let isOpen = $state(false);
let element = $state(null);

$effect(() => {
	if (!isOpen) return;
	return dismissOnOutside(() => element, () => (isOpen = false));
});
```

Call it from an effect that only runs while the surface is open, and return its result as the effect's teardown. It touches `document` directly, so it must not run during SSR — inside `$effect` it never does.

---

### fieldError util

Turns a superforms-style field error (`string | string[] | undefined`) into the single message the UI should show.

```javascript
import { firstError } from '@mbsmart/ui/utils';

firstError(['Device name is required', 'Device name must be at least 3 characters']);
// 'Device name is required'
firstError(''); // undefined
```

`TextInput`, `Field` and `CheckBox` already call this. Use it only when rendering an error by hand.

---

### fonts

Font preloading for server-rendered pages.

**Import:**

```javascript
import { fontPreload } from '@mbsmart/ui/utils';
```

#### `fontPreload(lang, { italic? })`

Returns a `preload` option for SvelteKit's `resolve(event, { preload })`. It keeps the
default JS and CSS preloads and adds the Rubik faces a page in `lang` renders:
`Rubik-latin` always (spaces, digits and punctuation are in the Latin subset, so every
page with text downloads it), plus `Rubik-hebrew` for `he`/`yi` or `Rubik-cyrillic` for
`ru`, and the italic of each when `italic` is set.

```typescript
// hooks.server.ts
return resolve(event, { preload: fontPreload(lang, { italic: true }) });
```

Without it the faces are discovered only after the stylesheet is parsed and
`font-display: swap` paints the first text in the fallback, then reflows. Only the
faces a page is sure to use are listed; preloading all eight would download scripts
`unicode-range` exists to skip. `latin-ext` is left to load on demand. A client-only SPA
shell has no route CSS to take font links from, so this only helps server-rendered and
prerendered pages. Used by the customer portal's marketing pages and every OAuth screen.

---

### labels

API label to human-readable text conversions.

**Import:**

```javascript
import {
	formatKeyAsLabel,
	getRestrictionLabel,
	getTextFilteringLabel,
	getYoutubeRequestLabel,
	isYoutubeCategory,
	getYoutubeColorKey,
	getFeatureGroupLabel,
	getSettingsGroupLabel,
	getSettingKeyLabel,
	getExtrasLabel,
	labelMaps
} from '@mbsmart/ui/utils';
```

**Functions:**

#### `formatKeyAsLabel(key)`

Converts snake_case/camelCase to Title Case.

```javascript
formatKeyAsLabel('some_api_key'); // 'Some Api Key'
formatKeyAsLabel('camelCase'); // 'Camel Case'
```

#### `getRestrictionLabel(key)`

Gets label for Apple restriction keys.

```javascript
getRestrictionLabel('ios_restrictions_apps_allow_imessage'); // 'Allow iMessage'
```

#### `getTextFilteringLabel(category)`

Gets label for text filtering categories.

```javascript
getTextFilteringLabel('Swimsuite'); // 'Swimwear' (fixes typo)
```

#### `getYoutubeRequestLabel(categoryId)`

Gets label for YouTube categories.

```javascript
getYoutubeRequestLabel('YT_Gamming'); // 'Gaming' (fixes typo)
```

#### `isYoutubeCategory(categoryId)`

Checks if a category is a YouTube category.

```javascript
isYoutubeCategory('YT_Music'); // true
isYoutubeCategory('Games'); // false
```

#### `getYoutubeColorKey(categoryId)`

Gets color key for YouTube categories.

```javascript
getYoutubeColorKey('YT_Education'); // 'green'
getYoutubeColorKey('YT_Entertainment'); // 'red'
```

#### `getFeatureGroupLabel(featureName)`

Gets label for feature groups.

```javascript
getFeatureGroupLabel('in-app-browser'); // 'In-App Browsers'
```

#### `getSettingsGroupLabel(groupName)`

Gets label for settings groups.

```javascript
getSettingsGroupLabel('account_security'); // 'Account Security'
```

#### `getSettingKeyLabel(settingKey)`

Gets label for setting keys.

```javascript
getSettingKeyLabel('global_system_filter_on'); // 'Filter Enabled'
```

---

### legal

The house style for the legal documents, plus the facts about them that more
than one surface has to agree on.

**Import:**

```javascript
import { legalProse, TERMS_LAST_UPDATED } from '@mbsmart/ui/utils';
```

**Exports:**

#### `legalProse`

An object of Tailwind class strings, one per element role in a legal document.
Applied by [`TermsContent`](#termscontent) and by the consuming app's own legal
pages, so the documents read as one set.

| Key             | Applies to                                          |
| --------------- | --------------------------------------------------- |
| `title`         | The document's own `<h2>`                           |
| `revised`       | The "Last updated" line under the title             |
| `heading`       | Section headings (`first:mt-0`)                     |
| `body`          | `<li>` text and other bare body text                |
| `paragraph`     | `<p>` — `body` plus a bottom margin                 |
| `emphasis`      | Inline emphasis inside body text                    |
| `link`          | Inline links                                        |
| `listOuter`     | Top-level `<ol>` — lower-alpha markers              |
| `listInner`     | Nested `<ol>` — lower-roman markers                 |
| `listOuterDisc` | Top-level `<ul>`                                    |
| `listInnerDisc` | Nested `<ul>`                                       |

#### `TERMS_LAST_UPDATED`

`string` — the Terms revision date (currently `'July 2026'`), printed by every
surface that frames `TermsContent`. Deliberately not translated: it stamps an
English-only document.

**Notes:**

- **The class strings must stay literal.** A consuming app's Tailwind build
  emits only the utilities it can see spelled out, and it sees these because the
  app's CSS carries `@source '../../node_modules/@mbsmart/ui/dist'`. Two things
  break the styling silently: building a class by concatenation here, or an app
  that consumes these without that `@source` line. Of the four portals only
  `customer-portal-svelte` has it today.
- **The ordered-list markers are explicit for a reason.** Tailwind's preflight
  resets `list-style` to none, which swallowed the `type="a"` / `type="i"`
  already on every `<ol>` in the Terms — leaving a document that
  cross-references "section A" with no visible lettering to find it by.
- **The density is tighter than an app's on purpose**, and there is no "compact"
  variant — this *is* the size. See the module header for the reasoning.

---

### preferences

The cookie contract behind the two preferences the whole estate shares — the colour
scheme ([theme](#theme)) and the language ([languageStore](#internationalization-i18n)).

**Import:**

```javascript
import {
	PREFERENCE_ZONE,
	preferenceCookieDomain,
	readPreference,
	writePreference,
	clearLegacyPreferences
} from '@mbsmart/ui/utils';
```

The portals are separate origins — `customer.`, `portal.`, `identity.` and `www.` under
`mb-smart.net` — so a shared preference cannot live in `localStorage`, which one origin
cannot read from another. `writePreference` sets the cookie with `Domain=.mb-smart.net`,
which every host under the zone is sent, and that is the whole mechanism.

**Outside the zone it degrades to a host-only cookie, by design.** `localhost` (a
`Domain` for it is invalid), Cloudflare Pages previews on `*.pages.dev` (a public suffix
the browser refuses to span), and `prod-test-customer.mbsmart.net` (the **un**hyphenated
zone — a different registrable domain) each remember the preference for themselves and
share it with nobody. Do not verify cross-portal syncing on a preview.

Two things are easy to get wrong and are handled here:

- **A zone-wide cookie does not replace a host-only one of the same name.** Cookie
  identity is (name, domain, path); the browser keeps both and, with equal paths, returns
  the one created first — the stale host-only twin. `writePreference` clears it before
  writing.
- **Nothing is migrated from the old per-portal keys.** `clearLegacyPreferences` deletes
  `mb_language`, `mb_setting_dark_mode` and the `theme` localStorage entry rather than
  reading them: a portal-local preference says nothing about what someone wants
  estate-wide, and the two portals that had one disagreed on the vocabulary anyway.

#### `preferenceCookieDomain(hostname?)`

The `Domain` to write with, or `undefined` off-zone. Takes an explicit hostname so a
server-side caller (SvelteKit's `cookies.set`) can use the same rule.

---

### theme

The estate-wide colour scheme: `light`, `dark` or `system`, in the `mb_theme` cookie.

**Import:**

```javascript
import {
	theme,
	THEMES,
	THEME_VALUES,
	THEME_COOKIE,
	getStoredTheme,
	isDark,
	prefersDark,
	paintedDark,
	applyTheme,
	setTheme,
	syncTheme,
	lockTheme,
	initTheme
} from '@mbsmart/ui/utils';
```

**Usage:**

```svelte
<script>
	import { onMount } from 'svelte';
	import { theme, THEME_VALUES, setTheme, initTheme } from '@mbsmart/ui/utils';

	onMount(() => initTheme()); // returns its own cleanup
</script>

<OneFromMany
	options={THEME_VALUES.map((value) => ({ value, label: t(`settings.${value}`) }))}
	selected={$theme}
	onSelect={setTheme}
/>
```

- **`setTheme` is the only writer.** It persists, paints and publishes. `theme.set` does
  none of those.
- **`applyTheme` paints and nothing else** — use it where the class may have been lost
  (a page that broke out of the app shell) but the preference has not changed.
- **A page that paints its own scheme calls `lockTheme`.** It returns a release
  function, so `onMount(() => { …paint…; return lockTheme(); })` is the whole pattern.
  Without it the next sync helpfully undoes the override — which is what would happen
  to the always-light legal documents the moment their reader came back to the tab.
- **`initTheme` is called once, from the root layout, in the browser.** It follows the
  two things that move the preference without this tab doing anything: the OS flipping
  its own scheme while we are on `system`, and another portal writing the cookie. The
  latter is why it listens on `visibilitychange` — a cookie fires no `storage` event, so
  a background tab is never told and has to look when it is next looked at.
- **`paintedDark` is a readable store of what `<html>` shows**, the `dark` class
  followed by a `MutationObserver`, not the preference, so a page holding `lockTheme`
  reads as what it paints. It is for choosing between two assets in script when only
  one should download (`ErrorPage`, the customer portal's Terms gate backdrop). It is
  always `false` on the server; a server-rendered page needs CSS for the first paint.

#### The pre-paint snippet — copied into each app, not imported

The `dark` class has to be on `<html>` before the first paint or dark mode flashes
white, and `lang`/`dir` before it or RTL flips a frame in. That means an inline
`<script>` in the app's `app.html`, running before any module — including this one —
has loaded. There is no way to share it as code. This is the canonical copy; a change
to a cookie name, to the theme vocabulary, or to the language list has to be mirrored
into every app that has one:

```html
<script>
	(function () {
		function getCookie(name) {
			var m = ('; ' + document.cookie).split('; ' + name + '=');
			return m.length === 2 ? decodeURIComponent(m.pop().split(';').shift()) : null;
		}

		// Colour scheme: 'light' | 'dark' | 'system'; absent means 'system'.
		var savedTheme = getCookie('mb_theme');
		var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.classList.toggle(
			'dark',
			savedTheme === 'dark' || ((savedTheme === 'system' || !savedTheme) && prefersDark)
		);

		// Language: stored preference, then what the device asks for, then English.
		// `iw`/`ji` are the pre-1989 codes for Hebrew and Yiddish — see
		// normalizeLanguageTag. An app with /{lang} routes checks the path first.
		var DIRECTIONS = { en: 'ltr', es: 'ltr', fr: 'ltr', he: 'rtl', ru: 'ltr', yi: 'rtl' };
		var ALIASES = { iw: 'he', ji: 'yi' };
		function normalize(tag) {
			if (!tag) return null;
			var base = String(tag).toLowerCase().split('-')[0];
			var code = ALIASES[base] || base;
			return DIRECTIONS[code] ? code : null;
		}
		function fromBrowser() {
			var tags = navigator.languages || [navigator.language || ''];
			for (var i = 0; i < tags.length; i++) {
				var code = normalize(tags[i]);
				if (code) return code;
			}
			return null;
		}
		var lang = normalize(getCookie('mb_lang')) || fromBrowser() || 'en';
		document.documentElement.lang = lang;
		document.documentElement.dir = DIRECTIONS[lang];
	})();
</script>
```

---

### stringUtils

String manipulation and fuzzy matching.

**Import:**

```javascript
import { levenshteinDistance, fuzzyMatch, fuzzyIncludes } from '@mbsmart/ui/utils';
```

**Functions:**

#### `levenshteinDistance(a, b)`

Calculates edit distance between two strings.

```javascript
levenshteinDistance('hello', 'hallo'); // 1
levenshteinDistance('test', 'test'); // 0
```

#### `fuzzyMatch(query, target, maxDistance?)`

Checks if query fuzzy-matches target within tolerance: some substring of the target is
within `maxDistance` edits of the query. Queries of one or two characters only match
exactly.

```javascript
fuzzyMatch('gams', 'games', 1); // true (1 typo: a missing letter)
fuzzyMatch('gmas', 'games', 1); // false (a swap is 2 edits)
fuzzyMatch('gmeas', 'games', 1); // false (2 typos)
fuzzyMatch('gam', 'games'); // true (substring)
```

Magic search calls this for every searchable element on every keystroke, and
`SearchableList` for every row, so it is one pass over the target (Sellers' algorithm:
Levenshtein with a free starting point) with reused typed arrays. Until September 2026
it compared the query against every window of `query.length ± maxDistance`, building a
fresh matrix for each; the answers are identical for whole-number tolerances (checked
against 500,000 random cases) and it is about 27× faster on a device page's worth of
terms.

#### `fuzzyIncludes(query, target, typoTolerance?)`

Alias for `fuzzyMatch` with default tolerance of 1.

```javascript
fuzzyIncludes('seach', 'search'); // true
fuzzyIncludes('serch', 'search'); // true
```

---

### minimizedModals

The shared stack of minimized [`Modal`](#modal)s, oldest first, plus the registry
of open ones. Each `Modal` registers itself while it is minimized and reads its
own index out to work out where in the bottom corner it belongs, and registers
its `minimize()` while it is open so that restoring any one modal can send the
others down. An app normally never touches either, but the stack is exported so a
host can tell how many modals are parked (or render its own indicator).

**Import:**

```javascript
import minimizedModals from '@mbsmart/ui/utils'; // The store itself
import { registerMinimized, unregisterMinimized } from '@mbsmart/ui/utils';
```

**API:**

| Export                     | Type                       | Description                                    |
| -------------------------- | -------------------------- | ---------------------------------------------- |
| `minimizedModals`          | `Writable<string[]>`       | Ids of the minimized modals, in stack order     |
| `registerMinimized(id)`    | `(string) => void`         | Adds an id to the bottom of the stack (idempotent) |
| `unregisterMinimized(id)`  | `(string) => void`         | Removes an id from the stack                    |
| `registerOpen(id, fn)`     | `(string, () => void) => void` | Notes an open modal and how to minimize it  |
| `unregisterOpen(id)`       | `(string) => void`         | Forgets a modal that has closed                 |
| `minimizeOthers(id)`       | `(string) => void`         | Minimizes every open modal except `id`          |

```svelte
{#if $minimizedModals.length}
	<span>{$minimizedModals.length} minimized</span>
{/if}
```

---

### toastStore

Svelte store for toast notifications.

**Import:**

```javascript
import { toast, showToast, removeToast } from '@mbsmart/ui/utils';
import toasts from '@mbsmart/ui/utils'; // The store itself
```

**Functions:**

#### `toast.success(message, duration?)`

Shows a success toast (green, 8000ms default).

```javascript
toast.success('Settings saved!');
toast.success('Done', 5000); // Custom duration
```

#### `toast.error(message, duration?)`

Shows an error toast (red, 30000ms default). Pass `0` to persist until dismissed.

```javascript
toast.error('Failed to save');
```

#### `toast.info(message, duration?)`

Shows an info toast (blue, 8000ms default).

```javascript
toast.info('Syncing...');
```

#### `toast.warning(message, duration?)`

Shows a warning toast (yellow, 10000ms default).

```javascript
toast.warning('Battery low');
```

#### `showToast(message, type, duration)`

Low-level function for custom toasts.

```javascript
showToast('Custom message', 'info', 0); // 0 = no auto-dismiss
```

#### `removeToast(id)`

Manually removes a toast by ID.

---

### urlUtils

URL processing and manipulation utilities.

**Import:**

```javascript
import {
	normalizeUrl,
	extractDomain,
	isValidUrlOrDomain,
	mergeUrlEntries,
	buildUrlUpdates
} from '@mbsmart/ui/utils';
```

**Functions:**

#### `normalizeUrl(url)`

Normalizes a URL by removing protocol, www, and trailing slashes.

```javascript
normalizeUrl('https://www.example.com/'); // 'example.com'
normalizeUrl('http://sub.example.com/path/'); // 'sub.example.com/path'
```

#### `extractDomain(url)`

Extracts the domain from a URL.

```javascript
extractDomain('https://www.example.com/path'); // 'example.com'
```

#### `isValidUrlOrDomain(str)`

Checks if a string looks like a valid URL/domain.

```javascript
isValidUrlOrDomain('example.com'); // true
isValidUrlOrDomain('invalid string'); // false
```

#### `mergeUrlEntries(urlList)`

Merges URL entries that have &-prefixed extension versions.

```javascript
// API returns separate entries for 'website.com' and '&website.com'
const merged = mergeUrlEntries([
	{ url: 'example.com', state: 'blocked' },
	{ url: '&example.com', state: 'extension_excluded' }
]);
// Result: [{ url: 'example.com', state: 'extension_excluded', hasExtensionEntry: true, ... }]
```

#### `buildUrlUpdates(baseUrl, newState, existingItem?)`

Builds URL update commands for the API.

```javascript
buildUrlUpdates('example.com', 'blocked');
// [{ url: 'example.com', state: 'blocked' }]

buildUrlUpdates('example.com', 'extension_excluded');
// [{ url: 'example.com', state: 'fully_open' }, { url: '&example.com', state: 'extension_excluded' }]

buildUrlUpdates('example.com', 'remove', existingItem);
// Removes both base and &-prefixed if they exist
```

---

## CSS Classes Reference

### `g2` — continuous-curvature ("squircle") corners

`border-radius` on its own draws a **G1** corner: a circular arc spliced onto the
straight edge, so curvature jumps from 0 to 1/r at the splice. The eye reads that
discontinuity as a faint kink. `g2` adds `corner-shape: squircle`, which swaps the arc
for a superellipse whose curvature ramps in smoothly — **G2** continuity, the corner
Apple uses on its hardware and app icons.

`g2` is a real Tailwind utility (registered with `@utility` in `styles.css`), so it
composes with variants and `@apply` exactly like `bg-azure-500` or `text-mulberry-700`.
Consuming apps get it from `@import '@mbsmart/ui/styles.css'` — no extra config.

```svelte
<div class="g2 rounded-xl">…</div>        <!-- squircle -->
<div class="g2">…</div>                   <!-- no-op: 0 radius has no corner to shape -->
<div class="g2 rounded-t-lg">…</div>      <!-- top corners squircled, bottom stay square -->
<div class="sm:g2 rounded-lg">…</div>     <!-- variants work -->
```

**Always pair `g2` with a radius.** `corner-shape` only reshapes corners that already
have one, which is why it is safe on partially rounded elements — the 0-radius corners
are left alone. It reshapes the whole border box, so borders, backgrounds, shadows,
rings and `overflow-hidden` clipping all follow it.

**Where to apply it** — the convention this library follows, and the one consuming apps
should match:

| | |
|---|---|
| ✅ Radii ≥ 8px (`rounded-lg` and up) | Cards, islands, modals, inputs, buttons, tooltips, toasts, icon tiles. The curve is long enough for the difference to register. |
| ❌ `rounded-full` | A 50% radius plus `squircle` is not a circle, it is an app-icon blob. Wrong for avatars, toggle knobs, pills, drag handles. |
| ❌ `rounded`/`rounded-sm` (≤ 4px) | The arc is too short to read — payload for no visual gain. |

**Browser support is progressive enhancement, no `@supports` needed on the shape.**
Browsers without `corner-shape` (Firefox, older Safari) drop the declaration and render
the plain G1 radius. Nothing breaks and no layout shifts — those users just get the
previous corner.

#### `--g2-scale` — the radius multiplier

A superellipse fills more of the corner than a circular arc of the same radius, so a
squircle at the authored radius reads *tighter* than the G1 corner it replaced. `g2`
compensates by drawing at `radius × var(--g2-scale)`, applied to `rounded-lg` through
`rounded-4xl`.

The scale is **1 on browsers without `corner-shape`** — they draw a circular corner,
which already looks right at the authored radius and must not be inflated.

Override it per app, in one line after the import:

```css
@import '@mbsmart/ui/styles.css';
@import 'tailwindcss';

:root {
	--g2-scale: 1.5;
}
```

The right value depends on which radii the app actually uses — a UI built mostly from
8px corners needs more compensation than one whose prominent surfaces are 16–44px.

For an **arbitrary** radius, multiply it in yourself; only the named scale is rescaled
automatically:

```svelte
<div class="g2 rounded-[calc(2.75rem*var(--g2-scale))]">…</div>
```

Components that apply `g2` internally do so on their own markup, so you get it for free:
`ControlButton`, `NavButton`, `NavDropdown`, `HeaderNav`, `Kbd`, `Toast`, `SafetyBadge`, `TextInput`,
`Info`, `ToggleSwitch` (the row, not the knob), `OneFromMany`, `Skeleton` (default),
`Island`, `NamedControl`, `Tabs`, `MultiInput`, `QuickLinks`, `Modal` (corner buttons and the minimized chip),
`SectionedPage`.

### `raised` — light on top, shade underneath

Three thin layers that make a flat fill read as a physical, pressable object rather
than a coloured rectangle: a 1px rim of white along the top edge, a 1px shade along
the bottom inner edge, and a drop shadow that grows on hover to lift the surface off
the page.

Like `g2` it is a real Tailwind utility registered in `styles.css`, so variants and
`@apply` work. Pair it with a fill:

```svelte
<button class="g2 rounded-lg bg-azure-600 raised">…</button>
```

The alphas are deliberately low. The effect should be felt at a glance and invisible
under inspection; if you can point at the highlight, it is too strong. They are pure
white and pure black rather than palette colours, so one class works on every fill and
on both grounds.

`&:disabled` drops the whole treatment, so an inert control never sits up off the page
asking to be pressed. That keys off the pseudo-class, so it works on real form
controls; a `<div>` posing as a button has nothing to match and stays raised.

**Where it does not belong.** Ghost and outline surfaces — with no fill there is no
face to light, and the rim plus drop shadow draw the outline of a button the design is
deliberately not showing. Sunken surfaces (inputs, wells, tracks) want the opposite
light: shade at the top, rim at the bottom.

**There is deliberately no wash down the face**, and the reason is stronger than taste.
Lightening a fill lowers its contrast with the white text on it, and these fills have
no room to give: `azure-600` tolerates only a 3.8% white overlay before dropping under
4.5:1, and it is that colour because a WCAG 1.4.3 audit prescribed it. A gradient of
any visible strength across the text band measures 3.97:1 and hands that failure back.
The two edge lines are safe from this because they are 1px, inside the padding, where
no glyph ever sits.

Applied internally by `ControlButton` (every variant except `transparent`).

### Helper Visibility Classes

The package uses CSS classes to hide helper elements:

```css
/* Hide keyboard shortcut hints */
html.hide-kbd .kbd-helper {
	display: none !important;
}

/* Hide info helper tooltips */
html.hide-info-helpers .info-helper {
	display: none !important;
}
```

### Magic Search Classes

For use with `SectionedPage`:

```css
.magicsearch-active        /* Added to wrapper when search is active */
.magicsearch-island        /* Add to Island wrapper divs */
.magicsearch-item          /* Add to individual searchable items */
.magicsearch-match         /* Added by JS when item matches search */
.magicsearch-island-match  /* Added when island title matches */
.magicsearch-nomatches     /* Added when no results found */
.magicsearch-noresults     /* "Nothing found" message container */
```

---

## Internationalization (i18n)

This package now includes a shared i18n engine and language store designed for use across MB Smart projects.

### Exports
Import from the package path `@mbsmart/ui/i18n`:

- `registerTranslations(data)` — merge/register project translations (key-first format: `{ namespace: { key: { en: '...', he: '...' } } }`).
- `t` — reactive translation store for templates: `{$t('namespace.key')}`.
- `tr(key, props)` — non-reactive translator for scripts: `tr('namespace.key', { name: 'John' })`.
- `getTranslation(key, lang, props)`, `hasTranslation(key)`, `addTranslation(namespace, key, langValues)`
- `getNamespaceKeys(namespace)`, `getAvailableLanguages()`

Language store available from same module:

- `language` — Svelte writable store with current language code.
- `setLanguage(lang)`, `setLanguageAndNavigate(lang, currentPath, navigateFn?)` — `setLanguageAndNavigate` accepts an optional navigation function (e.g., SvelteKit's `goto`).
- `getCurrentLanguage()`, `getLanguageInfo(code)`, `SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE`, `isRTL()`
- `LANGUAGE_COOKIE` — the estate-wide preference cookie (`mb_lang`), see [preferences](#preferences).

#### Which language a first-time visitor gets

The store initialises with `resolveInitialLanguage()`: **stored preference → the
device's own declared preference → English**. Someone who has picked a language has
said the most; failing that, a phone set to Hebrew opens in Hebrew.

That middle step is the browser's `navigator.languages` (or, on a server,
`Accept-Language`) — a *declared preference*, not a guess from where the request came
from. Do not add geo-IP to this ladder: country is not language, and for this product
especially — Hebrew, Yiddish and Russian speakers are scattered across Israel, the US,
the UK and Belgium — the IP is wrong far more often than the setting is.

- `resolveInitialLanguage()` — the full ladder. Browser only; returns `DEFAULT_LANGUAGE`
  on a server.
- `normalizeLanguageTag(tag)` — one BCP-47 tag to a supported code or `null`. `he-IL` →
  `he`, `de` → `null`. Regions are dropped; there is one translation per language.
- `pickSupportedLanguage(tags)` — first supported code in a list, best first. Feed it
  `navigator.languages`.
- `languageFromAcceptLanguage(header)` — for server-side resolution. Sorts by `q` rather
  than trusting header order, and drops `q=0` ("explicitly not this").

**The legacy codes are handled, and they are not a curiosity here.** Hebrew was `iw`
before ISO 639 renamed it `he`, and Yiddish was `ji`; Java's `Locale` still normalises
to the old spellings and legacy Android WebViews inherit them. Modern browsers say
`he-IL`, so it is a long tail — but one made of exactly the two languages this product
exists for, and an unrecognised tag falls through to English in silence. Anything
matching a language tag by hand must go through `normalizeLanguageTag`, including the
hand-copied pre-paint snippets.

### Usage (project)

1. In your app, register translations at startup (example for SvelteKit):

```js
import { registerTranslations } from '@mbsmart/ui/i18n';
import { translations } from '$lib/translations.js';

registerTranslations(translations);
```

2. In components and scripts:

```svelte
<script>
  import { t, tr } from '@mbsmart/ui/i18n';
</script>

<h1>{$t('dashboard.welcome')}</h1>
```

```js
import { tr } from '@mbsmart/ui/i18n';
const msg = tr('toast.success_login');
```

3. Language management:

```js
import { language, setLanguage, SUPPORTED_LANGUAGES } from '@mbsmart/ui/i18n';
setLanguage('he'); // switches language and updates document dir when used in-browser
```

Notes:
- The engine is intentionally data-agnostic: translation DATA should live in each project (as a key-first object) and be registered with `registerTranslations()`; this keeps the shared lib small and allows projects to control their translations and lazy-loading strategies.
- The `setLanguageAndNavigate` helper can accept a navigation function for frameworks that need it (SvelteKit's `goto`).

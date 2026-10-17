// KeysByTheDoorReminderCardUI — the car-keys reminder card (passive view).
//
// Owns: the 30 x 18 cm card surface (UIKit BackPlate), its FlexLayout content
//       (key icon + title, message line, demo-clock line) and the big
//       "I have my keys" UIKit Button (SceneObject name "HaveKeysButton").
// Inputs: only presentation knobs (labels, colors, reading distance).
// Public API (called by KeysByTheDoorController):
//   setMode("reminding" | "urgent" | "taken"), setClock(text), setVisible(bool)
//   onHaveKeys: PublicApi<void>  — fires when the big button is pinched.
// Must NOT: hold domain state, decide when to show, or move itself (the
//   controller owns visibility and the bounce offset on this SceneObject).

import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"

const imageMaterial = requireAsset("../Materials/ImageMaterial.mat") as Material
const ICON_KEY = requireAsset("../Icons/key.png") as Texture
const ICON_TAKEN = requireAsset("../Icons/check_circle.png") as Texture
const ICON_CLOCK = requireAsset("../Icons/schedule.png") as Texture

// ── Type scale — single source of truth (see specs-build-ui patterns.md → Typography)
const FONT_SIZE_SCALE = 1.0
type TextRole =
  | "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
  | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700}, Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700}, Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700}, Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500}, Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500}, Caption: {size: 38, weight: 500},
}
function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

// Card geometry is fixed by the design brief (about 30 x 18 cm, ~8 cm button).
const CARD_W = 30
const CARD_H = 18
const PAD = 1.5
const GAP = 1.5
const BUTTON_CM = 8
const INNER_H = CARD_H - PAD * 2
const LEFT_W = CARD_W - PAD * 2 - GAP - BUTTON_CM
const CONTENT_Z = 0.6
const LAYOUT_Z_LIFT = 0.02
const BUTTON_LABEL_Z = 0.08

const WHITE = new vec4(1, 1, 1, 1)
const SOFT_WHITE = new vec4(1, 1, 1, 0.8)

export type CardMode = "reminding" | "urgent" | "taken"

@component
export class KeysByTheDoorReminderCardUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">KeysByTheDoorReminderCardUI – car-keys reminder card (view only)</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Title shown while the reminder is waiting for you")
  titleText: string = "Car keys?"

  @input
  @hint("Label on the big button (wraps automatically inside the 8 cm button)")
  buttonLabel: string = "I have my keys"

  @input
  @hint("Message shown (in the alert color) when you head for the door without your keys")
  urgentMessage: string = "Wait! Take your keys."

  @input("vec4", "{1.0, 0.78, 0.3, 1.0}")
  @hint("Alert color used while the card bounces")
  @widget(new ColorWidget())
  alertColor: vec4 = new vec4(1.0, 0.78, 0.3, 1.0)

  @input("vec4", "{0.45, 0.95, 0.55, 1.0}")
  @hint("Color used once the keys are marked as taken")
  @widget(new ColorWidget())
  takenColor: vec4 = new vec4(0.45, 0.95, 0.55, 1.0)

  @input
  @hint("Distance (cm) the card is read from; scales all text so it stays readable from the living room")
  @widget(new SliderWidget(80, 300, 5))
  readingDistanceCm: number = 160
  @ui.group_end

  private titleTextComp: Text | null = null
  private messageTextComp: Text | null = null
  private clockTextComp: Text | null = null
  private buttonLabelComp: Text | null = null
  private titleIconMat: Material | null = null
  private haveKeysButton: Button | null = null
  private mode: CardMode = "reminding"

  private _onHaveKeys = new Event<void>()
  /** Fires when the big "I have my keys" button is pinched / clicked. */
  get onHaveKeys(): PublicApi<void> {
    return this._onHaveKeys.publicApi()
  }

  /** Current visual mode (for tests / inspection only). */
  get currentMode(): CardMode {
    return this.mode
  }

  /** Current title string (for tests / inspection only). */
  get currentTitle(): string {
    return this.titleTextComp ? this.titleTextComp.text : ""
  }

  onAwake() {
    this.build()
  }

  // ── Public API (Main → UI) ─────────────────────────────────────────────
  setVisible(visible: boolean): void {
    if (this.sceneObject.enabled !== visible) this.sceneObject.enabled = visible
  }

  setClock(text: string): void {
    if (this.clockTextComp && this.clockTextComp.text !== text) this.clockTextComp.text = text
  }

  setMode(mode: CardMode): void {
    this.mode = mode
    if (!this.titleTextComp || !this.messageTextComp || !this.buttonLabelComp || !this.titleIconMat) return
    if (mode === "taken") {
      this.titleTextComp.text = "Keys taken"
      this.titleTextComp.textFill.color = this.takenColor
      this.messageTextComp.text = "Have a good commute."
      this.messageTextComp.textFill.color = SOFT_WHITE
      this.buttonLabelComp.text = "Got them"
      this.titleIconMat.mainPass.baseTex = ICON_TAKEN
    } else if (mode === "urgent") {
      this.titleTextComp.text = this.titleText
      this.titleTextComp.textFill.color = this.alertColor
      this.messageTextComp.text = this.urgentMessage
      this.messageTextComp.textFill.color = this.alertColor
      this.buttonLabelComp.text = this.labelText()
      this.titleIconMat.mainPass.baseTex = ICON_KEY
    } else {
      this.titleTextComp.text = this.titleText
      this.titleTextComp.textFill.color = WHITE
      this.messageTextComp.text = "Time to leave. Got your keys?"
      this.messageTextComp.textFill.color = SOFT_WHITE
      this.buttonLabelComp.text = this.labelText()
      this.titleIconMat.mainPass.baseTex = ICON_KEY
    }
  }

  /** Button label with any line-break markers turned into spaces (the label wraps itself). */
  private labelText(): string {
    return (this.buttonLabel || "I have my keys").replace(/\\n|\n/g, " ")
  }

  // ── Build ──────────────────────────────────────────────────────────────
  private build(): void {
    this.sceneObject.createComponent("Component.Canvas")
    const plate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.size = new vec2(CARD_W, CARD_H)

    const content = this.obj(this.sceneObject, "Content", new vec3(0, 0, CONTENT_Z))
    this.addFlex(content, FlexDirection.Row, CARD_W, CARD_H, {
      pad: PAD, gap: GAP, justify: FlexJustify.Start, align: FlexAlign.Center,
    })

    // Left column: title row, message, clock row
    const left = this.child(content, "TextColumn", LEFT_W, INNER_H)
    this.addFlex(left, FlexDirection.Column, LEFT_W, INNER_H, {
      gap: 0.9, justify: FlexJustify.Center, align: FlexAlign.Start,
    })

    const titleRow = this.child(left, "TitleRow", LEFT_W, 3.4)
    this.addFlex(titleRow, FlexDirection.Row, LEFT_W, 3.4, {
      gap: 0.8, justify: FlexJustify.Start, align: FlexAlign.Center,
    })
    const iconSize = 3.0
    this.titleIconMat = this.addImage(this.child(titleRow, "KeyIcon", iconSize, iconSize), ICON_KEY)
    this.titleTextComp = this.addText(
      this.child(titleRow, "Title", LEFT_W - iconSize - 0.8, 3.4), this.titleText, "HeadlineXL", WHITE)

    this.messageTextComp = this.addText(
      this.child(left, "Message", LEFT_W, 3.6), "Time to leave. Got your keys?", "Body", SOFT_WHITE)
    this.messageTextComp.horizontalOverflow = HorizontalOverflow.Wrap

    const clockRow = this.child(left, "ClockRow", LEFT_W, 2.4)
    this.addFlex(clockRow, FlexDirection.Row, LEFT_W, 2.4, {
      gap: 0.6, justify: FlexJustify.Start, align: FlexAlign.Center,
    })
    const clockIcon = 1.8
    this.addImage(this.child(clockRow, "ClockIcon", clockIcon, clockIcon), ICON_CLOCK)
    this.clockTextComp = this.addText(
      this.child(clockRow, "ClockText", LEFT_W - clockIcon - 0.6, 2.4), "08:00:00  ·  leave 08:00", "Caption",
      new vec4(1, 1, 1, 0.65))

    // Right: big "I have my keys" button
    const btnObj = this.child(content, "HaveKeysButton", BUTTON_CM, BUTTON_CM)
    const btn = btnObj.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(BUTTON_CM, BUTTON_CM, 1) // BEFORE init
    this.haveKeysButton = btn
    this.buttonLabelComp = this.addButtonLabel(btnObj, this.labelText(), BUTTON_CM - 1.2)
    btn.onTriggerUp.add(() => this._onHaveKeys.invoke())

    this.setMode("reminding")
  }

  // ── Helpers (specs-build-ui helpers.md, adapted) ───────────────────────
  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    if (position) so.getTransform().setLocalPosition(position)
    return so
  }

  /** Creates a sized FlexItem child; the parent FlexLayout discovers it on start. */
  private child(parent: SceneObject, name: string, w: number, h: number): SceneObject {
    const so = this.obj(parent, name, new vec3(0, 0, LAYOUT_Z_LIFT))
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = w
    item.overrideHeight = h
    item.flexGrow = 0
    item.flexShrink = 0
    // FlexLayout auto-discovers FlexItem children on start (autoDiscoverItemsOnStart).
    return so
  }

  private addFlex(so: SceneObject, direction: FlexDirection, w: number, h: number,
      opts: {pad?: number; gap?: number; justify: FlexJustify; align: FlexAlign}): FlexLayout {
    const flex = so.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.onInitialized.add(() => {
      flex.width = w
      flex.height = h
      flex.direction = direction
      if (direction === FlexDirection.Row) flex.columnGap = opts.gap ?? 0
      else flex.rowGap = opts.gap ?? 0
      const p = opts.pad ?? 0
      flex.paddingTop = p
      flex.paddingBottom = p
      flex.paddingLeft = p
      flex.paddingRight = p
      flex.justifyContent = opts.justify
      flex.alignItems = opts.align
    })
    return flex
  }

  private addText(so: SceneObject, text: string, role: TextRole, color: vec4): Text {
    const t = so.createComponent("Component.Text") as Text
    t.text = text
    t.depthTest = true
    applyTextRole(t, role, this.readingDistanceCm)
    t.horizontalAlignment = HorizontalAlignment.Left
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.textFill.color = color
    return t
  }

  private addButtonLabel(parent: SceneObject, text: string, widthCM: number): Text {
    const so = this.obj(parent, "ButtonLabel", new vec3(0, 0, BUTTON_LABEL_Z))
    const t = so.createComponent("Component.Text") as Text
    t.text = text
    t.depthTest = true
    applyTextRole(t, "Callout", this.readingDistanceCm)
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Wrap
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-widthCM / 2, widthCM / 2, -3, 3)
    return t
  }

  private addImage(so: SceneObject, texture: Texture): Material {
    const img = so.createComponent("Component.Image") as Image
    const mat = imageMaterial.clone()
    mat.mainPass.baseTex = texture
    mat.mainPass.depthTest = true
    mat.mainPass.depthWrite = false
    img.clearMaterials()
    img.addMaterial(mat)
    return mat
  }
}

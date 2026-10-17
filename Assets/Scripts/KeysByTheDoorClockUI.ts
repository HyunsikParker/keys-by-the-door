// KeysByTheDoorClockUI — small "demo clock" panel in the living room (passive view).
//
// Owns: a UIKit BackPlate with a clock icon, the current demo time and a status line.
// Public API (called by KeysByTheDoorController): setClock(timeText, statusText)
// Must NOT: keep time itself or decide anything — the controller owns the demo clock.

import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"

const imageMaterial = requireAsset("../Materials/ImageMaterial.mat") as Material
const ICON_CLOCK = requireAsset("../Icons/schedule.png") as Texture

const FONT_SIZE_SCALE = 1.0
type TextRole = "HeadlineXL" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  HeadlineXL: {size: 62, weight: 700},
  Caption: {size: 38, weight: 500},
}
function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

const PANEL_W = 22
const PANEL_H = 7.5
const PAD = 1.2
const GAP = 1.0
const ICON = 3.2
const INNER_H = PANEL_H - PAD * 2
const TEXT_W = PANEL_W - PAD * 2 - GAP - ICON
const LAYOUT_Z_LIFT = 0.02

@component
export class KeysByTheDoorClockUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">KeysByTheDoorClockUI – demo clock panel (view only)</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Distance (cm) the panel is read from; scales the text")
  @widget(new SliderWidget(60, 250, 5))
  readingDistanceCm: number = 120
  @ui.group_end

  private timeText: Text | null = null
  private statusText: Text | null = null

  onAwake() {
    this.sceneObject.createComponent("Component.Canvas")
    const plate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.size = new vec2(PANEL_W, PANEL_H)

    const content = this.obj(this.sceneObject, "Content", new vec3(0, 0, 0.6))
    this.addFlex(content, FlexDirection.Row, PANEL_W, PANEL_H, PAD, GAP, FlexAlign.Center)

    const iconObj = this.child(content, "ClockIcon", ICON, ICON)
    const img = iconObj.createComponent("Component.Image") as Image
    const mat = imageMaterial.clone()
    mat.mainPass.baseTex = ICON_CLOCK
    mat.mainPass.depthTest = true
    mat.mainPass.depthWrite = false
    img.clearMaterials()
    img.addMaterial(mat)

    const col = this.child(content, "ClockText", TEXT_W, INNER_H)
    this.addFlex(col, FlexDirection.Column, TEXT_W, INNER_H, 0, 0.3, FlexAlign.Start)
    this.timeText = this.addText(this.child(col, "Time", TEXT_W, 2.8), "07:59:00", "HeadlineXL", new vec4(1, 1, 1, 1))
    this.statusText = this.addText(this.child(col, "Status", TEXT_W, 1.8), "Leave at 08:00", "Caption",
      new vec4(1, 1, 1, 0.7))
  }

  /** Main → UI: push the formatted demo time and a short status line. */
  setClock(timeText: string, statusText: string): void {
    if (this.timeText && this.timeText.text !== timeText) this.timeText.text = timeText
    if (this.statusText && this.statusText.text !== statusText) this.statusText.text = statusText
  }

  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    if (position) so.getTransform().setLocalPosition(position)
    return so
  }

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
      pad: number, gap: number, align: FlexAlign): void {
    const flex = so.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.onInitialized.add(() => {
      flex.width = w
      flex.height = h
      flex.direction = direction
      if (direction === FlexDirection.Row) flex.columnGap = gap
      else flex.rowGap = gap
      flex.paddingTop = pad
      flex.paddingBottom = pad
      flex.paddingLeft = pad
      flex.paddingRight = pad
      flex.justifyContent = FlexJustify.Center
      flex.alignItems = align
    })
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
}

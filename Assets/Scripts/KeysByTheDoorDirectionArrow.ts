// KeysByTheDoorDirectionArrow — small out-of-view hint arrow.
//
// Owns: a flat code-authored arrow mesh (MeshBuilder) on this SceneObject
//       ("DirectionArrow"), placed each frame just inside the user's view and
//       rotated to point toward a world target.
// Inputs: arrowMaterial (unlit, light color — additive display), placement knobs.
// Public API (called by KeysByTheDoorController): pointAt(camPos, camRot, target), setVisible(bool)
// Must NOT: decide when it is needed — the controller owns that.

@component
export class KeysByTheDoorDirectionArrow extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">KeysByTheDoorDirectionArrow – out-of-view hint arrow</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Unlit material for the arrow; keep it light/bright (black is invisible on Specs)")
  arrowMaterial!: Material
  @ui.group_end
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("How far in front of the eyes the arrow floats (cm)")
  @widget(new SliderWidget(30, 120, 1))
  distanceCm: number = 55

  @input
  @hint("How far from the view center the arrow sits, toward the target (cm)")
  @widget(new SliderWidget(0, 25, 0.5))
  offsetFromCenterCm: number = 9

  @input
  @hint("Arrow size multiplier (1 = about 6.5 cm long)")
  @widget(new SliderWidget(0.3, 3, 0.1))
  arrowScale: number = 1
  @ui.group_end

  private visual: RenderMeshVisual | null = null

  onAwake() {
    const mb = new MeshBuilder([
      {name: "position", components: 3},
      {name: "normal", components: 3},
    ])
    mb.topology = MeshTopology.Triangles
    mb.indexType = MeshIndexType.UInt16
    const s = this.arrowScale
    // Flat arrow in local XY, pointing +X. Shaft x∈[-3,1], head tip at x=3.5.
    const pts: number[][] = [
      [-3, -0.6], [1, -0.6], [1, 0.6], [-3, 0.6], // shaft 0..3
      [1, -1.8], [3.5, 0], [1, 1.8], // head 4..6
    ]
    const verts: number[] = []
    for (const p of pts) verts.push(p[0] * s, p[1] * s, 0, 0, 0, 1)
    mb.appendVerticesInterleaved(verts)
    // Front faces (CCW seen from +Z) plus reversed copies so it is visible from both sides.
    const front = [0, 1, 2, 0, 2, 3, 4, 5, 6]
    const back: number[] = []
    for (let i = 0; i < front.length; i += 3) back.push(front[i], front[i + 2], front[i + 1])
    mb.appendIndices(front.concat(back))
    mb.updateMesh()

    this.visual = this.sceneObject.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    this.visual.mesh = mb.getMesh()
    if (this.arrowMaterial) this.visual.mainMaterial = this.arrowMaterial
  }

  get isVisible(): boolean {
    return this.sceneObject.enabled
  }

  setVisible(visible: boolean): void {
    if (this.sceneObject.enabled !== visible) this.sceneObject.enabled = visible
  }

  /** Place the arrow in front of the camera, offset toward `target`, pointing at it. */
  pointAt(camPos: vec3, camRot: quat, target: vec3): void {
    const local = camRot.invert().multiplyVec3(target.sub(camPos))
    let angle = Math.atan2(local.y, local.x)
    if (Math.abs(local.x) < 0.001 && Math.abs(local.y) < 0.001) angle = 0
    const offset = new vec3(
      Math.cos(angle) * this.offsetFromCenterCm,
      Math.sin(angle) * this.offsetFromCenterCm * 0.7,
      -this.distanceCm,
    )
    const t = this.sceneObject.getTransform()
    t.setWorldPosition(camPos.add(camRot.multiplyVec3(offset)))
    t.setWorldRotation(camRot.multiply(quat.angleAxis(angle, new vec3(0, 0, 1))))
  }
}

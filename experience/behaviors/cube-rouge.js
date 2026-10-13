// Behavior « cube-rouge » : un cube 3D rouge qui flotte au centre de l'affiche et tourne lentement.

/** @type {import('../../core/behaviors').Behavior} */
export default {
  onFound(ctx) {
    if (!ctx.state.cube) {
      // Cube de 20 % de la largeur de l'affiche (1 unité = largeur de l'affiche).
      const taille = 0.2
      const geometrie = new ctx.THREE.BoxGeometry(taille, taille, taille)
      const materiau = new ctx.THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.3,
        metalness: 0.1,
      })
      const cube = new ctx.THREE.Mesh(geometrie, materiau)

      // Centre de l'affiche (x: 0.5, y: 0.5), décollé de 0.15 vers le spectateur (+Z).
      cube.position.copy(ctx.toLocal(0.5, 0.5, 0.15))

      ctx.poster.add(cube)
      ctx.state.cube = cube
    } else if (ctx.state.cube.parent !== ctx.poster) {
      ctx.poster.add(ctx.state.cube)
    }

    // Le cube devient visible dès que l'affiche est détectée.
    ctx.state.cube.visible = true
  },

  onLost(ctx) {
    // Le cube se cache quand l'affiche n'est plus visible.
    if (ctx.state.cube) {
      ctx.state.cube.visible = false
    }
  },

  onUpdate(ctx, t, dt) {
    const cube = ctx.state.cube
    if (!cube || !cube.visible) return

    // Rotation lente sur lui-même.
    cube.rotation.x += dt * 0.5
    cube.rotation.y += dt * 0.8
  },
}

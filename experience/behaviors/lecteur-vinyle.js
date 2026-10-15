// Behavior « lecteur-vinyle » : vinyle/CD 3D flottant et lecteur audio interactif
// avec affichage double onglet (VERSION 1: Recherche Deezer avec bouton +, VERSION 2: Playlist avec recherche rétractable)
// et synchronisation collaborative via ctx.shared ("essais") et Deezer.

/** @type {import('../../core/behaviors').Behavior} */
export default {
  onFound(ctx) {
    // -------------------------------------------------------------------------
    // 1. CRÉATION DU CD / VINYLE 3D (au-dessus du centre de l'affiche)
    // -------------------------------------------------------------------------
    if (!ctx.state.vinylRoot) {
      const root = new ctx.THREE.Group()

      // Texture procédurale du disque
      const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(512, 512)
        : (window.OffscreenCanvas ? new window.OffscreenCanvas(512, 512) : null)
      const c = canvas ? canvas.getContext('2d') : null
      if (c) {
        c.fillStyle = '#0a0a0c'
        c.fillRect(0, 0, 512, 512)

        // Sillons circulaires
        c.strokeStyle = 'rgba(255, 68, 30, 0.08)'
        c.lineWidth = 1.2
        for (let r = 60; r < 240; r += 3) {
          c.beginPath()
          c.arc(256, 256, r, 0, Math.PI * 2)
          c.stroke()
        }

        // Reflets subtils en dégradé orangé
        const grad = c.createLinearGradient(0, 0, 512, 512)
        grad.addColorStop(0, 'rgba(240, 68, 28, 0.22)')
        grad.addColorStop(0.4, 'rgba(0, 0, 0, 0)')
        grad.addColorStop(0.6, 'rgba(0, 0, 0, 0)')
        grad.addColorStop(1, 'rgba(240, 68, 28, 0.25)')
        c.fillStyle = grad
        c.beginPath()
        c.arc(256, 256, 245, 0, Math.PI * 2)
        c.fill()
      }

      // Plateau tournant
      const turntable = new ctx.THREE.Group()

      // Épaisseur 3D du CD
      const epaisseur = 0.012
      const rayon = 0.27
      const trouRayon = 0.08

      // Tranche extérieure
      const cdEdgeGeo = new ctx.THREE.CylinderGeometry(rayon, rayon, epaisseur, 64, 1, true)
      const cdEdgeMat = new ctx.THREE.MeshStandardMaterial({
        color: 0xd0d0d8,
        roughness: 0.2,
        metalness: 0.8,
        side: ctx.THREE.DoubleSide,
      })
      const discMesh = new ctx.THREE.Mesh(cdEdgeGeo, cdEdgeMat)
      discMesh.rotation.x = Math.PI / 2
      turntable.add(discMesh)

      // Petit trou central 1/3
      const petitTrouRayon = trouRayon / 3

      const innerEdgeGeo = new ctx.THREE.CylinderGeometry(petitTrouRayon, petitTrouRayon, epaisseur, 48, 1, true)
      const innerEdgeMat = new ctx.THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.4,
        transparent: true,
        opacity: 0.6,
        side: ctx.THREE.DoubleSide,
      })
      const innerEdgeMesh = new ctx.THREE.Mesh(innerEdgeGeo, innerEdgeMat)
      innerEdgeMesh.rotation.x = Math.PI / 2
      turntable.add(innerEdgeMesh)

      // Anneau fin orange sur le contour extérieur
      const rimGeo = new ctx.THREE.TorusGeometry(rayon, 0.0018, 16, 64)
      const rimMat = new ctx.THREE.MeshStandardMaterial({
        color: 0xf0441c,
        roughness: 0.25,
        metalness: 0.75,
      })
      const frontRim = new ctx.THREE.Mesh(rimGeo, rimMat)
      frontRim.position.z = epaisseur / 2
      turntable.add(frontRim)

      // Surface centrale 70% opaque noir
      const hubGeo = new ctx.THREE.RingGeometry(petitTrouRayon, trouRayon, 64)
      const hubMat = new ctx.THREE.MeshStandardMaterial({
        color: 0x09080a,
        transparent: true,
        opacity: 0.70,
        roughness: 0.2,
        metalness: 0.5,
        side: ctx.THREE.DoubleSide,
      })
      const hubMesh = new ctx.THREE.Mesh(hubGeo, hubMat)
      hubMesh.position.z = epaisseur / 2 + 0.0006
      turntable.add(hubMesh)

      // Fin liseré orange petit trou
      const innerRimGeo = new ctx.THREE.TorusGeometry(petitTrouRayon, 0.001, 16, 48)
      const innerRimMesh = new ctx.THREE.Mesh(innerRimGeo, rimMat)
      innerRimMesh.position.z = epaisseur / 2 + 0.0008
      turntable.add(innerRimMesh)

      // Jonction avec la cover
      const hubBorderGeo = new ctx.THREE.TorusGeometry(trouRayon, 0.0012, 16, 48)
      const hubBorderMesh = new ctx.THREE.Mesh(hubBorderGeo, rimMat)
      hubBorderMesh.position.z = epaisseur / 2 + 0.0008
      turntable.add(hubBorderMesh)

      // Face avant : pochette album
      const labelGeo = new ctx.THREE.RingGeometry(trouRayon, rayon - 0.001, 64)
      const labelMat = new ctx.THREE.MeshBasicMaterial({
        color: 0x881111,
        side: ctx.THREE.DoubleSide,
      })
      const labelMesh = new ctx.THREE.Mesh(labelGeo, labelMat)
      labelMesh.position.z = epaisseur / 2 + 0.0006
      turntable.add(labelMesh)

      // Face arrière optique
      const backGeo = new ctx.THREE.RingGeometry(trouRayon, rayon - 0.001, 64)
      const backMat = new ctx.THREE.MeshStandardMaterial({
        color: 0xdfe2ec,
        roughness: 0.15,
        metalness: 0.88,
        side: ctx.THREE.DoubleSide,
      })
      const backMesh = new ctx.THREE.Mesh(backGeo, backMat)
      backMesh.position.z = -epaisseur / 2 - 0.0006
      turntable.add(backMesh)

      root.add(turntable)
      root.position.copy(ctx.toLocal(0.5, 0.44, 0.28))
      root.rotation.set(0, 0, 0)

      ctx.poster.add(root)

      ctx.state.vinylRoot = root
      ctx.state.turntable = turntable
      ctx.state.labelMesh = labelMesh
    } else if (ctx.state.vinylRoot.parent !== ctx.poster) {
      ctx.poster.add(ctx.state.vinylRoot)
    }

    ctx.state.vinylRoot.visible = true

    // -------------------------------------------------------------------------
    // 2. INTERFACE UTILISATEUR (ctx.ui.panel)
    // -------------------------------------------------------------------------
    if (ctx.state.uiReady) return
    ctx.state.uiReady = true

    ctx.state.trackCache = new Map()
    ctx.state.playlistTracks = []
    ctx.state.currentIndex = 0
    ctx.state.isPlaying = false

    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    ctx.state.audio = audio

    const panel = ctx.ui.panel('vinyle-player', { position: 'bottom', keep: true })

    panel.innerHTML = `
      <div class="cd-device-root">
        <!-- PARTIE NOIRE SUPÉRIEURE (DRAWER PLAYLIST AVEC 2 ONGLETS) -->
        <div class="cd-drawer is-closed tab-playlist-active">
          <!-- En-tête : Onglet PLAYLIST à gauche / AJOUTER MORCEAUX à droite avec biseau -->
          <div class="cd-drawer-header">
            <div class="cd-tabs-nav">
              <button class="cd-tab-btn cd-tab-left is-active" data-tab="version-2">
                <span>PLAYLIST</span>
              </button>
              <button class="cd-tab-btn cd-tab-right" data-tab="version-1">
                <span>AJOUTER MORCEAUX</span>
              </button>
            </div>
            <button class="cd-drawer-close" aria-label="Fermer" title="Fermer">✕</button>
          </div>

          <!-- CONTENU ONGLET VERSION 2 (PLAYLIST ENTIÈRE + BOUTON RECHERCHE RÉTRACTABLE) - ACTIF PAR DÉFAUT -->
          <div class="cd-tab-content is-active" id="tab-version-2">
            <!-- Barre d'outils de la playlist avec recherche rétractable à droite -->
            <div class="cd-v2-header">
              <div class="cd-v2-title">NOMBRE DE TITRES: <span class="cd-v2-count">0</span></div>
              
              <!-- Bouton recherche qui s'étend en barre de recherche au clic -->
              <div class="cd-v2-search-box is-collapsed">
                <button class="cd-v2-search-btn" aria-label="Rechercher dans la playlist" title="Rechercher dans la playlist">
                  <svg viewBox="0 0 24 24" class="cd-search-ico">
                    <circle cx="11" cy="11" r="7" stroke="#f0441c" stroke-width="2.4" fill="none" />
                    <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="#f0441c" stroke-width="2.4" stroke-linecap="round" />
                  </svg>
                </button>
                <div class="cd-v2-search-bar">
                  <input type="text" class="cd-v2-search-input" placeholder="RECHERCHER DANS LA PLAYLIST..." />
                  <button class="cd-v2-search-close" title="Fermer la recherche">✕</button>
                </div>
              </div>
            </div>

            <div class="cd-drawer-scroll-area">
              <div class="cd-playlist-items">
                <div class="cd-loading-txt">Chargement de la playlist...</div>
              </div>
            </div>
          </div>

          <!-- CONTENU ONGLET VERSION 1 (RECHERCHE + BOUTON +) -->
          <div class="cd-tab-content" id="tab-version-1">
            <div class="cd-search-capsule">
              <input type="text" class="cd-search-input" placeholder="RECHERCHER..." />
              <div class="cd-search-btns">
                <button class="cd-search-submit" aria-label="Lancer la recherche" title="Rechercher">
                  <svg viewBox="0 0 24 24" class="cd-search-ico">
                    <circle cx="11" cy="11" r="7" stroke="#e84522" stroke-width="2.4" fill="none" />
                    <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="#e84522" stroke-width="2.4" stroke-linecap="round" />
                  </svg>
                </button>
                <button class="cd-search-reset" aria-label="Remettre à zéro" title="Remettre la recherche à zéro">
                  <svg viewBox="0 0 24 24" class="cd-refresh-ico">
                    <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="#e84522" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="cd-search-status"></div>

            <div class="cd-drawer-scroll-area">
              <div class="cd-tab1-manifesto">Cette playlist a pour objectif de créer du lien social entre les étudiants pendant la canicule. Notre but est de placer des affiches comme celle que vous voyez devant vous aux fenêtres des appartements. Notre intention première était de protéger les étudiants de la chaleur pour combattre la précarité et sensibiliser sur les effets sur la santé mentale des jeunes isolés. Pour cela, les passants, voyant l'affiche, peuvent ajouter des musiques dans la playlist collaborative.</div>
              <div class="cd-search-results"></div>
            </div>
          </div>
        </div>

        <!-- PLAYER D'ORIGINE (CAPSULE HORIZONTALE) -->
        <div class="cd-capsule-bar">
          <!-- GAUCHE : Cover album identique au CD avec transition animée -->
          <div class="cd-cover-slot" title="Pochette de l'album en cours">
            <!-- Emplacement circulaire masquant les transitions horizontales (droite) -->
            <div class="cd-slot-circle-mask">
              <div class="cd-cover-disc is-active">
                <img class="cd-cover-img" src="" alt="Cover" />
                <div class="cd-disc-center-hole"></div>
              </div>
            </div>
            <!-- Emplacement pour les transitions verticales (haut) limitées par le player -->
            <div class="cd-slot-vertical-stage"></div>
          </div>

          <!-- CENTRE : Écran LCD défilant + Boutons de contrôle ergonomiques -->
          <div class="cd-middle-console">
            <!-- Écran capsule avec défilement de droite à gauche et barre de progression -->
            <div class="cd-screen-capsule">
              <div class="cd-marquee-wrapper">
                <div class="cd-marquee-track">
                  <span class="cd-marquee-text">CHARGEMENT...</span>
                  <span class="cd-marquee-text-dup">CHARGEMENT...</span>
                </div>
              </div>
              <div class="cd-progress-container" title="Position de lecture">
                <div class="cd-progress-track">
                  <div class="cd-progress-bar"></div>
                </div>
              </div>
            </div>

            <!-- Boutons de contrôle : Précédent, Play/Pause, Suivant -->
            <div class="cd-controls-row">
              <!-- Précédent -->
              <button class="cd-btn cd-btn-prev" aria-label="Précédent" title="Précédent">
                <svg viewBox="0 0 36 28" class="cd-svg-icon">
                  <polygon points="16,14 34,3 34,25" fill="#f0441c" />
                  <polygon points="2,14 20,3 20,25" fill="#f0441c" />
                  <rect x="0" y="3" width="3.5" height="22" fill="#f0441c" rx="1" />
                </svg>
              </button>

              <!-- Lecture / Pause (Nouveau design net et centré) -->
              <button class="cd-btn cd-btn-play" aria-label="Lecture ou pause" title="Lecture">
                <svg viewBox="0 0 36 36" class="cd-svg-icon cd-icon-play">
                  <circle cx="18" cy="18" r="17" fill="none" stroke="#f0441c" stroke-width="2.5" />
                  <polygon points="13,10 27,18 13,26" fill="#f0441c" />
                </svg>
                <svg viewBox="0 0 36 36" class="cd-svg-icon cd-icon-pause" style="display:none;">
                  <circle cx="18" cy="18" r="17" fill="none" stroke="#f0441c" stroke-width="2.5" />
                  <rect x="11.5" y="10" width="4.5" height="16" fill="#f0441c" rx="1" />
                  <rect x="20" y="10" width="4.5" height="16" fill="#f0441c" rx="1" />
                </svg>
              </button>

              <!-- Suivant (Nouveau design net et centré) -->
              <button class="cd-btn cd-btn-next" aria-label="Suivant" title="Suivant">
                <svg viewBox="0 0 36 28" class="cd-svg-icon">
                  <polygon points="20,14 2,3 2,25" fill="#f0441c" />
                  <polygon points="34,14 16,3 16,25" fill="#f0441c" />
                  <rect x="32.5" y="3" width="3.5" height="22" fill="#f0441c" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          <!-- DROITE : Bouton PLAYLIST rond noir qui tourne comme le CD -->
          <button class="cd-playlist-btn" aria-label="Ouvrir la playlist" title="PLAYLIST">
            <div class="cd-playlist-dial">
              <svg viewBox="0 0 100 100" class="cd-playlist-svg">
                <path id="curve-playlist-top" d="M 14,50 A 36,36 0 0,1 86,50" fill="none" />
                <path id="curve-playlist-bottom" d="M 86,50 A 36,36 0 0,1 14,50" fill="none" />
                <text fill="#e84522" font-family="'Hammersmith One', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="15" letter-spacing="3.8">
                  <textPath href="#curve-playlist-top" startOffset="50%" text-anchor="middle">
                    PLAYLIST
                  </textPath>
                </text>
                <text fill="#e84522" font-family="'Hammersmith One', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="15" letter-spacing="3.8">
                  <textPath href="#curve-playlist-bottom" startOffset="50%" text-anchor="middle">
                    PLAYLIST
                  </textPath>
                </text>
              </svg>
            </div>
          </button>
        </div>
      </div>
    `

    ctx.ui.style(`
      @font-face {
        font-family: 'Bitcount Single';
        font-style: normal;
        font-weight: 100 900;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/bitcountsingle/v3/or2uQ6T72-iP2RY6OLSkb95a817cjULDyyhvb6tTxCxtAOObpH9NnfLjSWiXv_OGqtjRD0BNzrItMZWC-9SK8R6EpA2l9RAyEMMpnu5kMto.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Bitcount Single';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/bitcountsingle/v3/or2uQ6T72-iP2RY6OLSkb95a817cjULDyyhvb6tTxCxtAOObpH9NnfLjSWiXv_OGqtjRD0BNzrItMZWC-9SK8R6EpA2l9RAyEMMpnu5kMto.woff2') format('woff2');
      }

      /* Le conteneur UI (#ra-hotspots) et le player passent devant le viseur (.ra-aim z-index: 20) */
      #ra-hotspots {
        z-index: 25;
      }
      .ra-panels {
        z-index: 25;
      }
      .ra-panel,
      .ra-panel.is-bottom,
      .ra-panel.vinyle-player {
        z-index: 25;
        background: transparent !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      .ra-aim {
        z-index: 10 !important;
      }

      /* Quand le menu (drawer) est ouvert, le viseur est obligatoirement placé derrière */
      :root:has(.cd-drawer:not(.is-closed)) .ra-aim,
      body:has(.cd-drawer:not(.is-closed)) .ra-aim {
        z-index: 10 !important;
      }

      .cd-device-root,
      .cd-device-root * {
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .cd-device-root {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 580px;
        margin: 0 auto;
        box-sizing: border-box;
      }

      /* DRAWER SUPÉRIEUR */
      .cd-drawer {
        width: 480px;
        max-width: 94vw;
        background: #19191d;
        border: none;
        border-radius: 28px 28px 0 0;
        padding: 0 0 75px 0;
        position: relative;
        display: flex;
        flex-direction: column;
        margin-bottom: -60px;
        z-index: 10;
        box-shadow: 0 -12px 36px rgba(0,0,0,0.85);
        box-sizing: border-box;
        overflow: hidden;
      }
      .cd-drawer.is-closed {
        display: none;
      }

      /* EN-TÊTE DU DRAWER : BANDEAU BISEAUTÉ PLEINE LARGEUR */
      .cd-drawer-header {
        position: relative;
        width: 100%;
        height: 52px;
        display: flex;
        align-items: stretch;
        background: transparent;
        border-bottom: none;
        box-sizing: border-box;
      }
      .cd-tabs-nav {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: stretch;
        position: relative;
      }
      .cd-tab-btn {
        appearance: none;
        outline: none;
        border: none;
        border-radius: 0;
        background: #111114;
        color: #bf2925;
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, color 0.2s ease;
        position: relative;
        box-sizing: border-box;
      }
      .cd-tab-btn span {
        position: relative;
        z-index: 2;
        pointer-events: none;
      }

      /* Onglet gauche (PLAYLIST) avec coupure oblique en biseau */
      .cd-tab-btn.cd-tab-left {
        flex: 0 0 40%;
        clip-path: polygon(0 0, 100% 0, calc(100% - 24px) 100%, 0 100%);
        padding: 0 16px 0 20px;
        justify-content: center;
      }

      /* Onglet droit (AJOUTER MORCEAUX) commençant au biseau */
      .cd-tab-btn.cd-tab-right {
        flex: 1;
        margin-left: -24px;
        clip-path: polygon(24px 0, 100% 0, 100% 100%, 0 100%);
        padding: 0 48px 0 20px;
        justify-content: center;
      }

      /* Couleurs selon actif/inactif conformes à la couleur #e84522 */
      .cd-tab-btn.is-active {
        background: #e84522;
        color: #000000;
      }
      .cd-tab-btn:not(.is-active) {
        background: #111114;
        color: #e84522;
      }
      .cd-tab-btn:hover,
      .cd-tab-btn:not(.is-active):hover {
        background: #e84522;
        color: #000000;
      }

      /* Bouton rond de fermeture : dans AJOUTER MORCEAUX, croix orange avec fond noir */
      .cd-drawer-close {
        position: absolute;
        top: 10px;
        right: 14px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #000000;
        border: none;
        color: #e84522;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        transition: transform 0.15s, background 0.15s, color 0.15s;
      }
      .cd-drawer-close:hover {
        transform: scale(1.1);
        background: #000000;
        color: #e84522;
      }
      .cd-drawer-close:active {
        transform: scale(0.9);
      }

      /* Dans l'onglet PLAYLIST : croix noire avec fond orange */
      .cd-drawer.tab-playlist-active .cd-drawer-close,
      .cd-drawer:has(.cd-tab-left.is-active) .cd-drawer-close {
        background: #e84522;
        color: #000000;
      }
      .cd-drawer.tab-playlist-active .cd-drawer-close:hover,
      .cd-drawer:has(.cd-tab-left.is-active) .cd-drawer-close:hover {
        background: #e84522;
        color: #000000;
      }

      /* ONGLETS CONTENU */
      .cd-tab-content {
        display: none;
        flex-direction: column;
        gap: 12px;
        padding: 14px 18px 0;
        height: 284px;
        min-height: 284px;
        box-sizing: border-box;
      }
      .cd-tab-content.is-active {
        display: flex;
      }

      /* BARRE DE RECHERCHE VERSION 1 */
      .cd-search-capsule {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #0c0b0d;
        border-radius: 9999px;
        padding: 8px 16px;
        border: 1.5px solid rgba(232, 69, 34, 0.45);
      }
      .cd-search-input {
        flex: 1;
        background: transparent;
        border: none;
        color: #e84522;
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.8px;
        outline: none;
        text-transform: uppercase;
      }
      .cd-search-input::placeholder {
        color: #e84522;
        opacity: 0.75;
      }
      .cd-search-btns {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .cd-search-submit,
      .cd-search-reset {
        background: transparent;
        border: none;
        color: #e84522;
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .cd-search-submit:hover {
        transform: scale(1.15);
      }
      .cd-search-submit:active {
        transform: scale(0.9);
      }
      .cd-search-reset:hover {
        transform: rotate(90deg) scale(1.15);
      }
      .cd-search-reset:active {
        transform: rotate(270deg) scale(0.9);
      }
      .cd-refresh-ico {
        width: 17px;
        height: 17px;
        display: block;
      }

      .cd-search-status {
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 700;
        color: #e84522;
        text-align: center;
        min-height: 14px;
      }

      /* TEXTE EXPLICATIF ONGLET AJOUTER MORCEAUX */
      .cd-tab1-manifesto {
        color: #e84522;
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12.5px;
        line-height: 1.5;
        text-align: justify;
        text-justify: inter-word;
        hyphens: none;
        -webkit-hyphens: none;
        padding: 4px 8px 10px;
        letter-spacing: 0.2px;
      }

      /* ZONE DE DÉFILEMENT INTÉRIEURE */
      .cd-drawer-scroll-area {
        background: #0c0b0d;
        border-radius: 14px;
        padding: 10px 12px;
        max-height: 220px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: none;
        scrollbar-width: thin;
        scrollbar-color: #e84522 #2c2c31;
      }
      #tab-version-1 .cd-drawer-scroll-area {
        background: transparent;
        padding: 0;
        flex: 1;
      }
      .cd-drawer-scroll-area::-webkit-scrollbar {
        width: 8px;
      }
      .cd-drawer-scroll-area::-webkit-scrollbar-track {
        background: #2c2c31;
        border-radius: 9999px;
      }
      .cd-drawer-scroll-area::-webkit-scrollbar-thumb {
        background: #e84522;
        border-radius: 9999px;
      }
      .cd-drawer-scroll-area::-webkit-scrollbar-thumb:hover {
        background: #f0441c;
      }

      /* VERSION 2 EN-TÊTE AVEC RECHERCHE RÉTRACTABLE */
      .cd-v2-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        min-height: 38px;
      }
      .cd-v2-title {
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.8px;
        color: #e84522;
        text-transform: uppercase;
      }
      .cd-v2-search-box {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }
      .cd-v2-search-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #2b2b2f;
        border: 1.5px solid #f0441c;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        transition: transform 0.15s, background 0.15s;
      }
      .cd-v2-search-btn:active {
        transform: scale(0.9);
      }
      .cd-search-ico {
        width: 17px;
        height: 17px;
        display: block;
      }

      /* Barre de recherche déroulante dans VERSION 2 */
      .cd-v2-search-bar {
        display: none;
        align-items: center;
        background: #0c0b0d;
        border: 1.5px solid #f0441c;
        border-radius: 9999px;
        padding: 4px 10px 4px 14px;
        width: 250px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.7);
        animation: cd-expand 0.2s ease-out;
      }
      @keyframes cd-expand {
        from { opacity: 0; transform: scaleX(0.7); }
        to { opacity: 1; transform: scaleX(1); }
      }
      .cd-v2-search-box:not(.is-collapsed) .cd-v2-search-btn {
        display: none;
      }
      .cd-v2-search-box:not(.is-collapsed) .cd-v2-search-bar {
        display: flex;
      }
      .cd-v2-search-input {
        flex: 1;
        background: transparent;
        border: none;
        color: #f0441c;
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.5px;
        outline: none;
        text-transform: uppercase;
      }
      .cd-v2-search-input::placeholder {
        color: #f0441c;
        opacity: 0.75;
      }
      .cd-v2-search-close {
        background: transparent;
        border: none;
        color: #f0441c;
        font-size: 15px;
        font-weight: 900;
        cursor: pointer;
        padding: 0 4px;
      }

      /* LIGNES D'ITEMS */
      .cd-search-results, .cd-playlist-items {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      .cd-row-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      .cd-row-thumb {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        background: #1a1a1c;
        flex-shrink: 0;
        border: none;
      }
      .cd-row-title-pill {
        background: #28282c;
        border-radius: 9999px;
        padding: 7px 12px;
        color: #ffffff;
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 400;
        letter-spacing: 0.4px;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-transform: none;
        border: none;
      }
      .cd-row-item.is-active .cd-row-title-pill {
        background: #e84522;
        border: none;
        color: #000000;
      }

      /* MORCEAUX DANS L'ONGLET AJOUTER MORCEAUX : COULEUR DE POLICE ORANGE */
      #tab-version-1 .cd-row-title-pill,
      .cd-search-results .cd-row-title-pill {
        color: #e84522;
      }

      /* MORCEAUX DANS LA PLAYLIST : FOND #bf2925, SURVOL ET SÉLECTION #e84522 */
      .cd-playlist-items .cd-row-title-pill {
        background: #bf2925;
        color: #000000;
        font-weight: 400;
        border: none;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .cd-playlist-items .cd-row-item.cd-row-clickable:hover .cd-row-title-pill {
        background: #e84522;
        color: #000000;
        border: none;
      }
      .cd-playlist-items .cd-row-item.is-active .cd-row-title-pill {
        background: #e84522;
        color: #000000;
        border: none;
        box-shadow: 0 0 10px rgba(232, 69, 34, 0.45);
      }
      .cd-playlist-items .cd-row-thumb {
        border: none;
      }

      /* PETIT BOUTON "+" POUR LA VERSION 1 */
      .cd-btn-plus {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #f0441c;
        color: #000000;
        border: none;
        font-size: 20px;
        font-weight: 900;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: transform 0.12s, background 0.15s;
        box-shadow: 0 2px 6px rgba(240, 68, 28, 0.4);
      }
      .cd-btn-plus:active {
        transform: scale(0.85);
      }
      .cd-btn-plus.is-added {
        background: #000000;
        color: #e84522;
        box-shadow: none;
      }

      /* LIGNES CLIQUABLES DANS LA PLAYLIST */
      .cd-row-item.cd-row-clickable {
        cursor: pointer;
        transition: transform 0.12s ease;
      }
      .cd-row-item.cd-row-clickable:hover .cd-row-title-pill {
        background: #e84522;
        color: #000000;
        border: none;
      }
      .cd-row-item.cd-row-clickable:active {
        transform: scale(0.98);
      }

      .cd-empty-hint, .cd-loading-txt {
        font-family: 'Hammersmith One', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.55);
        text-align: center;
        padding: 12px 6px;
      }

      /* PARTIE INFÉRIEURE : CAPSULE BAR (Partie grise foncée) */
      .cd-capsule-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #1c1c1e;
        border-radius: 9999px;
        padding: 10px 18px;
        width: 540px;
        max-width: 95vw;
        box-shadow: 0 10px 32px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.08);
        position: relative;
        z-index: 20;
        box-sizing: border-box;
        overflow: hidden; /* Masque tout élément d'animation qui sort du player (partie grise foncée) */
      }

      /* GAUCHE : Cover album identique au CD avec animation de transition */
      .cd-cover-slot {
        width: 74px;
        height: 74px;
        flex-shrink: 0;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Masque circulaire (74x74px) : l'animation de/vers la droite se limite strictement à l'emplacement cercle */
      .cd-slot-circle-mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 74px;
        height: 74px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 2;
      }

      /* Scène verticale : non bridée par le cercle, découpée par la bordure supérieure de .cd-capsule-bar */
      .cd-slot-vertical-stage {
        position: absolute;
        top: 0;
        left: 0;
        width: 74px;
        height: 74px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 3;
      }

      .cd-cover-disc {
        position: absolute;
        top: 0;
        left: 0;
        width: 74px;
        height: 74px;
        border-radius: 50%;
        overflow: hidden;
        background: radial-gradient(circle, #28282c 0%, #0c0b0d 85%);
        border: 2.5px solid #111113;
        box-shadow: 0 4px 12px rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        will-change: transform, opacity;
      }
      .cd-cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        display: block;
        pointer-events: none;
      }
      .cd-disc-center-hole {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #1c1c1e;
        border: 2px solid rgba(255, 255, 255, 0.25);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.9);
        pointer-events: none;
        z-index: 2;
      }

      /* Transitions animées du CD avec effet de transparence */
      /* 1. Bouton Suivant (droite) : le CD actuel part à droite (limité au cercle), le nouveau arrive du haut (limité au player) */
      .cd-disc-exit-right {
        animation: cd-disc-anim-exit-right 0.34s cubic-bezier(0.4, 0.0, 0.6, 1) forwards;
        pointer-events: none;
      }
      .cd-disc-enter-top {
        animation: cd-disc-anim-enter-top 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        pointer-events: none;
      }

      /* 2. Bouton Précédent (gauche) : le CD actuel part vers le haut (transparent à la limite), le nouveau arrive de la droite */
      .cd-disc-exit-top {
        animation: cd-disc-anim-exit-top 0.34s cubic-bezier(0.4, 0.0, 0.6, 1) forwards;
        pointer-events: none;
      }
      .cd-disc-enter-right {
        animation: cd-disc-anim-enter-right 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        pointer-events: none;
      }

      /* Sortie par la droite : limitée à la forme cercle du CD */
      @keyframes cd-disc-anim-exit-right {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        50% {
          opacity: 0.45;
        }
        100% {
          transform: translateX(52px);
          opacity: 0;
        }
      }

      /* Arrivée du haut : seule la partie à l'intérieur du player (partie grise foncée) est visible */
      @keyframes cd-disc-anim-enter-top {
        0% {
          transform: translateY(-44px);
          opacity: 0.15;
        }
        35% {
          transform: translateY(-24px);
          opacity: 0.6;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Sortie vers le haut : totalement transparent à la limite supérieure du player */
      @keyframes cd-disc-anim-exit-top {
        0% {
          transform: translateY(0);
          opacity: 1;
        }
        25% {
          transform: translateY(-6px);
          opacity: 0.45;
        }
        55% {
          transform: translateY(-12px);
          opacity: 0.08;
        }
        80% {
          transform: translateY(-18px);
          opacity: 0;
        }
        100% {
          transform: translateY(-24px);
          opacity: 0;
        }
      }

      /* Arrivée de droite : 100% transparent avant l'emplacement cercle, visible seulement dans le cercle */
      @keyframes cd-disc-anim-enter-right {
        0% {
          transform: translateX(74px);
          opacity: 0;
        }
        20% {
          opacity: 0.1;
        }
        55% {
          opacity: 0.65;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      /* CENTRE : Console écran + boutons */
      .cd-middle-console {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 1;
        padding: 0 14px;
        min-width: 0;
      }

      /* Écran capsule orange/rouge */
      .cd-screen-capsule {
        width: 260px;
        max-width: 100%;
        height: 40px;
        background: #f0441c;
        border-radius: 9999px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        overflow: hidden;
        position: relative;
        padding: 4px 14px 4px;
        box-sizing: border-box;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(240,68,28,0.3);
      }
      .cd-marquee-wrapper {
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        display: flex;
        align-items: center;
        height: 16px;
      }
      .cd-marquee-track {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        animation: cd-marquee 6s linear infinite;
        will-change: transform;
      }
      .cd-marquee-text, .cd-marquee-text-dup {
        display: inline-block;
        padding-right: 48px;
        font-family: 'Bitcount Single', monospace !important;
        font-size: 14px;
        font-weight: 400;
        color: #000000;
        letter-spacing: 1.2px;
        text-transform: none;
        line-height: 1;
      }
      @keyframes cd-marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* Barre de progression sous le texte de la musique */
      .cd-progress-container {
        width: 190px;
        max-width: 82%;
        height: 6px;
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 1px 0;
      }
      .cd-progress-track {
        width: 100%;
        height: 3.5px;
        background: rgba(0, 0, 0, 0.28);
        border-radius: 9999px;
        overflow: hidden;
        position: relative;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
        transition: background 0.15s;
      }
      .cd-progress-container:hover .cd-progress-track {
        background: rgba(0, 0, 0, 0.38);
      }
      .cd-progress-bar {
        width: 0%;
        height: 100%;
        background: #000000;
        border-radius: 9999px;
        transition: width 0.08s linear;
      }

      /* Rangée des boutons de contrôle */
      .cd-controls-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .cd-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.12s;
      }
      .cd-btn:active {
        transform: scale(0.9);
      }
      .cd-btn-prev, .cd-btn-next {
        width: 36px;
        height: 28px;
      }
      .cd-btn-play {
        width: 42px;
        height: 42px;
      }
      .cd-svg-icon {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* DROITE : Bouton PLAYLIST rotatif */
      .cd-playlist-btn {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        background: #0c0b0d;
        border: 2px solid #242428;
        box-shadow: 0 4px 12px rgba(0,0,0,0.7);
        flex-shrink: 0;
        cursor: pointer;
        padding: 0;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s, border-color 0.2s;
      }
      .cd-playlist-btn:hover {
        border-color: #f0441c;
      }
      .cd-playlist-btn:active {
        transform: scale(0.94);
      }
      .cd-playlist-dial {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: cd-dial-spin 6s linear infinite;
      }
      .cd-playlist-dial.is-playing {
        animation-duration: 2.2s;
      }
      @keyframes cd-dial-spin {
        to { transform: rotate(360deg); }
      }
      .cd-playlist-svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `)

    // DOM Elements
    const coverSlot = panel.querySelector('.cd-cover-slot')
    const marqueeText = panel.querySelector('.cd-marquee-text')
    const marqueeTextDup = panel.querySelector('.cd-marquee-text-dup')
    const progressContainer = panel.querySelector('.cd-progress-container')
    const progressBar = panel.querySelector('.cd-progress-bar')
    const playBtn = panel.querySelector('.cd-btn-play')
    const iconPlay = panel.querySelector('.cd-icon-play')
    const iconPause = panel.querySelector('.cd-icon-pause')
    const prevBtn = panel.querySelector('.cd-btn-prev')
    const nextBtn = panel.querySelector('.cd-btn-next')
    const playlistBtn = panel.querySelector('.cd-playlist-btn')
    const playlistDial = panel.querySelector('.cd-playlist-dial')

    const drawer = panel.querySelector('.cd-drawer')
    const closeDrawerBtn = panel.querySelector('.cd-drawer-close')

    // Onglets
    const tabButtons = panel.querySelectorAll('.cd-tab-btn')
    const tabV1 = panel.querySelector('#tab-version-1')
    const tabV2 = panel.querySelector('#tab-version-2')

    // V1 Recherche
    const searchInput = panel.querySelector('.cd-search-input')
    const searchSubmit = panel.querySelector('.cd-search-submit')
    const searchReset = panel.querySelector('.cd-search-reset')
    const searchStatus = panel.querySelector('.cd-search-status')
    const searchResults = panel.querySelector('.cd-search-results')

    // V2 Playlist
    const v2Count = panel.querySelector('.cd-v2-count')
    const playlistItemsContainer = panel.querySelector('.cd-playlist-items')
    const v2SearchBox = panel.querySelector('.cd-v2-search-box')
    const v2SearchBtn = panel.querySelector('.cd-v2-search-btn')
    const v2SearchInput = panel.querySelector('.cd-v2-search-input')
    const v2SearchClose = panel.querySelector('.cd-v2-search-close')

    // S'assurer que les conteneurs parents du panneau le positionnent au-dessus du viseur (.ra-aim z-index: 20)
    try {
      if (panel.parentElement) panel.parentElement.style.zIndex = '25'
      if (panel.parentElement && panel.parentElement.parentElement) {
        panel.parentElement.parentElement.style.zIndex = '25'
      }
    } catch (_) {}

    const updateDrawerState = () => {
      const isOpen = !drawer.classList.contains('is-closed')
      panel.classList.toggle('is-drawer-open', isOpen)
    }

    // Fonction de sélection d'onglet
    const selectTab = (target) => {
      tabButtons.forEach((b) => {
        b.classList.toggle('is-active', b.getAttribute('data-tab') === target)
      })
      if (target === 'version-2') {
        tabV2.classList.add('is-active')
        tabV1.classList.remove('is-active')
        drawer.classList.add('tab-playlist-active')
        drawer.classList.remove('tab-ajouter-active')
      } else {
        tabV1.classList.add('is-active')
        tabV2.classList.remove('is-active')
        drawer.classList.add('tab-ajouter-active')
        drawer.classList.remove('tab-playlist-active')
      }
    }

    // Gestion de l'ouverture / fermeture du drawer (arrive direct sur PLAYLIST à l'ouverture)
    playlistBtn.addEventListener('click', () => {
      const willOpen = drawer.classList.contains('is-closed')
      drawer.classList.toggle('is-closed')
      if (willOpen) {
        selectTab('version-2')
      }
      updateDrawerState()
    })
    closeDrawerBtn.addEventListener('click', () => {
      drawer.classList.add('is-closed')
      updateDrawerState()
    })

    // Navigation entre onglets PLAYLIST et AJOUTER MORCEAUX
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab')
        if (target) selectTab(target)
      })
    })

    // Gestion de la recherche rétractable dans VERSION 2
    v2SearchBtn.addEventListener('click', () => {
      v2SearchBox.classList.remove('is-collapsed')
      v2SearchInput.focus()
    })
    v2SearchClose.addEventListener('click', () => {
      v2SearchInput.value = ''
      v2SearchBox.classList.add('is-collapsed')
      renderPlaylistItems()
    })
    v2SearchInput.addEventListener('input', () => {
      renderPlaylistItems()
    })

    // Formate les titres pour respecter minuscules sauf majuscules de début de mot/phrase ou noms propres
    const formaterCasseTitre = (str) => {
      if (!str || typeof str !== 'string') return ''
      const trimmed = str.trim()
      if (trimmed.length <= 3) return trimmed // préserver acronymes courts (ex: PNL, DJ, USA...)
      const aDesLettres = /[a-zA-ZÀ-ÿ]/.test(trimmed)
      // Si la chaîne est complètement en majuscules (ex: "ONE MORE TIME", "STARBOY")
      if (aDesLettres && trimmed === trimmed.toUpperCase()) {
        return trimmed.toLowerCase().replace(/(^|[\s\-–—'’(«"/])([a-zA-ZÀ-ÿ])/g, (_, sep, char) => sep + char.toUpperCase())
      }
      // Si la chaîne est complètement en minuscules (ex: "one more time")
      if (aDesLettres && trimmed === trimmed.toLowerCase()) {
        return trimmed.replace(/(^|[\s\-–—'’(«"/])([a-zA-ZÀ-ÿ])/g, (_, sep, char) => sep + char.toUpperCase())
      }
      return trimmed
    }

    // Met à jour le texte défilant dans l'écran LCD
    const updateMarquee = (title, artist) => {
      const text = `${formaterCasseTitre(title)} - ${formaterCasseTitre(artist)}`
      if (marqueeText) marqueeText.textContent = text
      if (marqueeTextDup) marqueeTextDup.textContent = text
    }

    // Animation de transition de disque (pochette CD sur le player) avec effet de transparence
    const animateDiscCover = (coverUrl, direction = 'next') => {
      if (!coverSlot || !coverUrl) return

      const circleMask = coverSlot.querySelector('.cd-slot-circle-mask')
      const verticalStage = coverSlot.querySelector('.cd-slot-vertical-stage')
      if (!circleMask || !verticalStage) return

      const currentDisc = coverSlot.querySelector('.cd-cover-disc.is-active')
      const currentImg = currentDisc ? currentDisc.querySelector('.cd-cover-img') : null

      // Premier chargement ou direction nulle : injection directe sans animation de sortie
      if (direction === 'none' || !currentDisc || !currentImg || !currentImg.getAttribute('src')) {
        circleMask.innerHTML = `
          <div class="cd-cover-disc is-active">
            <img class="cd-cover-img" src="${coverUrl}" alt="Cover" />
            <div class="cd-disc-center-hole"></div>
          </div>
        `
        verticalStage.innerHTML = ''
        return
      }

      // Si c'est déjà la même cover et aucune animation en cours, rien à faire
      if (currentImg.src === coverUrl && !coverSlot.querySelector('.cd-disc-exit-right, .cd-disc-exit-top')) {
        return
      }

      // Nettoyer les disques précédents en sortie pour éviter les accumulations lors de clics rapides
      coverSlot.querySelectorAll('.cd-cover-disc:not(.is-active)').forEach((el) => el.remove())

      currentDisc.classList.remove('is-active')

      if (direction === 'next') {
        // --- BOUTON DROITE (SUIVANT) ---
        // 1. Sortie vers la droite : confinée strictement dans la forme cercle du CD (.cd-slot-circle-mask)
        currentDisc.classList.add('cd-disc-exit-right')
        circleMask.appendChild(currentDisc)

        const cleanupExit = () => {
          if (currentDisc.parentNode) currentDisc.remove()
        }
        currentDisc.addEventListener('animationend', cleanupExit, { once: true })
        setTimeout(cleanupExit, 420)

        // 2. Arrivée du haut : dans .cd-slot-vertical-stage, coupée par la limite supérieure du player (.cd-capsule-bar)
        verticalStage.innerHTML = `
          <div class="cd-cover-disc is-active cd-disc-enter-top">
            <img class="cd-cover-img" src="${coverUrl}" alt="Cover" />
            <div class="cd-disc-center-hole"></div>
          </div>
        `
        const newDisc = verticalStage.firstElementChild
        if (newDisc) {
          const onEnterEnd = () => {
            newDisc.classList.remove('cd-disc-enter-top')
            if (circleMask) {
              circleMask.innerHTML = ''
              circleMask.appendChild(newDisc)
            }
          }
          newDisc.addEventListener('animationend', onEnterEnd, { once: true })
          setTimeout(onEnterEnd, 420)
        }
      } else {
        // --- BOUTON GAUCHE (PRÉCÉDENT) ---
        // 1. Sortie vers le haut : dans .cd-slot-vertical-stage, totalement transparente à la limite du player
        verticalStage.innerHTML = ''
        verticalStage.appendChild(currentDisc)
        currentDisc.classList.add('cd-disc-exit-top')

        const cleanupExit = () => {
          if (currentDisc.parentNode) currentDisc.remove()
        }
        currentDisc.addEventListener('animationend', cleanupExit, { once: true })
        setTimeout(cleanupExit, 420)

        // 2. Arrivée de droite : dans .cd-slot-circle-mask, 100% transparente avant l'emplacement cercle
        circleMask.innerHTML = `
          <div class="cd-cover-disc is-active cd-disc-enter-right">
            <img class="cd-cover-img" src="${coverUrl}" alt="Cover" />
            <div class="cd-disc-center-hole"></div>
          </div>
        `
        const newDisc = circleMask.firstElementChild
        if (newDisc) {
          const onEnterEnd = () => {
            newDisc.classList.remove('cd-disc-enter-right')
          }
          newDisc.addEventListener('animationend', onEnterEnd, { once: true })
          setTimeout(onEnterEnd, 420)
        }
      }
    }

    // Mise à jour de la pochette sur le CD 3D et dans le player
    const update3DVinylCover = (coverUrl, direction = 'next') => {
      animateDiscCover(coverUrl, direction)

      if (!ctx.state.labelMesh || !coverUrl) return
      const loader = new ctx.THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')
      loader.load(
        coverUrl,
        (tex) => {
          tex.colorSpace = ctx.THREE.SRGBColorSpace
          ctx.state.labelMesh.material = new ctx.THREE.MeshBasicMaterial({
            map: tex,
            side: ctx.THREE.DoubleSide,
          })
        },
        undefined,
        () => {
          ctx.state.labelMesh.material = new ctx.THREE.MeshBasicMaterial({
            color: 0x881111,
            side: ctx.THREE.DoubleSide,
          })
        }
      )
    }

    // Charger et jouer un morceau
    const chargerMorceau = (index, autoPlay = true, direction = 'next') => {
      const list = ctx.state.playlistTracks
      if (!list || list.length === 0) return

      const prevIndex = ctx.state.currentIndex
      ctx.state.currentIndex = (index + list.length) % list.length
      const track = list[ctx.state.currentIndex]
      if (!track) return

      const dir = direction || (index >= prevIndex ? 'next' : 'prev')

      updateMarquee(track.title, track.artist)
      update3DVinylCover(track.cover, dir)
      audio.src = track.preview
      if (progressBar) progressBar.style.width = '0%'

      // Met en surbrillance dans la playlist
      const rows = playlistItemsContainer.querySelectorAll('.cd-row-item')
      rows.forEach((row) => {
        const rowId = Number(row.getAttribute('data-id'))
        row.classList.toggle('is-active', rowId === track.id)
      })

      if (autoPlay) {
        audio.play().then(() => {
          ctx.state.isPlaying = true
          iconPlay.style.display = 'none'
          iconPause.style.display = 'block'
          playlistDial.classList.add('is-playing')
        }).catch((err) => {
          ctx.log(`Lecture : ${err.message}`)
        })
      }
    }

    // Contrôles de lecture
    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        if (!audio.src && ctx.state.playlistTracks.length > 0) {
          chargerMorceau(ctx.state.currentIndex, true, 'next')
        } else {
          audio.play().then(() => {
            ctx.state.isPlaying = true
            iconPlay.style.display = 'none'
            iconPause.style.display = 'block'
            playlistDial.classList.add('is-playing')
          }).catch((err) => ctx.log(err.message))
        }
      } else {
        audio.pause()
        ctx.state.isPlaying = false
        iconPlay.style.display = 'block'
        iconPause.style.display = 'none'
        playlistDial.classList.remove('is-playing')
      }
    })

    prevBtn.addEventListener('click', () => {
      chargerMorceau(ctx.state.currentIndex - 1, true, 'prev')
    })

    nextBtn.addEventListener('click', () => {
      chargerMorceau(ctx.state.currentIndex + 1, true, 'next')
    })

    audio.addEventListener('ended', () => {
      if (progressBar) progressBar.style.width = '0%'
      chargerMorceau(ctx.state.currentIndex + 1, true, 'next')
    })

    audio.addEventListener('pause', () => {
      ctx.state.isPlaying = false
      iconPlay.style.display = 'block'
      iconPause.style.display = 'none'
      playlistDial.classList.remove('is-playing')
    })

    audio.addEventListener('play', () => {
      ctx.state.isPlaying = true
      iconPlay.style.display = 'none'
      iconPause.style.display = 'block'
      playlistDial.classList.add('is-playing')
    })

    // Suivi de la barre de progression en temps réel
    if (progressContainer && progressBar) {
      audio.addEventListener('timeupdate', () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          const pct = Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100))
          progressBar.style.width = `${pct}%`
        } else {
          progressBar.style.width = '0%'
        }
      })

      // Déplacement au clic sur la barre de progression
      progressContainer.addEventListener('click', (e) => {
        if (!audio.duration || isNaN(audio.duration) || audio.duration <= 0) return
        const rect = progressContainer.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const fraction = Math.min(1, Math.max(0, clickX / rect.width))
        audio.currentTime = fraction * audio.duration
      })
    }

    // Rendu de la VERSION 2 (Playlist entière avec filtre)
    const renderPlaylistItems = () => {
      const allTracks = ctx.state.playlistTracks || []
      if (v2Count) v2Count.textContent = String(allTracks.length)

      const filterVal = (v2SearchInput ? v2SearchInput.value : '').trim().toLowerCase()
      const filtered = filterVal
        ? allTracks.filter((t) => t.title.toLowerCase().includes(filterVal) || t.artist.toLowerCase().includes(filterVal))
        : allTracks

      if (filtered.length === 0) {
        playlistItemsContainer.innerHTML = filterVal
          ? '<div class="cd-empty-hint">Aucun morceau ne correspond à votre filtre.</div>'
          : '<div class="cd-loading-txt">La playlist est vide. Utilisez l\'onglet AJOUTER MORCEAUX pour en ajouter !</div>'
        return
      }

      playlistItemsContainer.innerHTML = ''
      filtered.forEach((track) => {
        const isCurrent = allTracks[ctx.state.currentIndex]?.id === track.id
        const itemHtml = `
          <div class="cd-row-item cd-row-clickable ${isCurrent ? 'is-active' : ''}" data-id="${track.id}" title="Cliquer pour écouter">
            ${track.cover ? `<img src="${track.cover}" class="cd-row-thumb" alt="cover" />` : ''}
            <div class="cd-row-title-pill">${formaterCasseTitre(track.title)} - ${formaterCasseTitre(track.artist)}</div>
          </div>
        `
        playlistItemsContainer.insertAdjacentHTML('beforeend', itemHtml)
      })

      playlistItemsContainer.querySelectorAll('.cd-row-item').forEach((row) => {
        row.addEventListener('click', () => {
          const trackId = Number(row.getAttribute('data-id'))
          const realIndex = allTracks.findIndex((t) => t.id === trackId)
          if (realIndex !== -1) {
            const dir = realIndex >= ctx.state.currentIndex ? 'next' : 'prev'
            chargerMorceau(realIndex, true, dir)
          }
        })
      })
    }

    // Récupération des infos Deezer
    const fetchTrackInfo = async (deezerId) => {
      if (ctx.state.trackCache.has(deezerId)) {
        return ctx.state.trackCache.get(deezerId)
      }
      try {
        const data = await ctx.deezer(`/track/${deezerId}`)
        if (data && data.id) {
          const track = {
            id: data.id,
            title: data.title,
            artist: data.artist?.name || 'Artiste inconnu',
            cover: data.album?.cover_medium || data.album?.cover_small || '',
            preview: data.preview,
          }
          ctx.state.trackCache.set(deezerId, track)
          return track
        }
      } catch (err) {
        ctx.log(`Deezer info : ${err.message}`)
      }
      return null
    }

    // -------------------------------------------------------------------------
    // 3. SYNCHRONISATION EN TEMPS RÉEL ("essais")
    // -------------------------------------------------------------------------
    const fallbackTrack = {
      id: 3135556,
      title: 'One More Time',
      artist: 'Daft Punk',
      cover: 'https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/250x250-000000-80-0-0.jpg',
      preview: '',
    }

    ctx.shared.watch('essais', async (elements) => {
      const deezerIds = elements.map((e) => e.deezerId).filter((id) => Boolean(id))

      if (deezerIds.length === 0) {
        ctx.state.playlistTracks = [fallbackTrack]
        renderPlaylistItems()
        if (!audio.src) {
          const demoInfo = await fetchTrackInfo(fallbackTrack.id)
          if (demoInfo) {
            ctx.state.playlistTracks = [demoInfo]
            renderPlaylistItems()
            chargerMorceau(0, false, 'none')
          }
        }
        return
      }

      const results = await Promise.all(deezerIds.map((id) => fetchTrackInfo(id)))
      const validTracks = results.filter((t) => t !== null && Boolean(t.preview))

      if (validTracks.length > 0) {
        ctx.state.playlistTracks = validTracks
        renderPlaylistItems()

        if (!audio.src) {
          chargerMorceau(0, false, 'none')
        }
      }
    }, (err) => {
      ctx.log(`Playlist : ${err.message}`)
    })

    // -------------------------------------------------------------------------
    // 4. VERSION 1 : RECHERCHE DEEZER AVEC LE BOUTON "+"
    // -------------------------------------------------------------------------
    const executerRecherche = async () => {
      const query = searchInput.value.trim()
      if (!query) return

      searchStatus.textContent = 'RECHERCHE SUR DEEZER...'
      searchResults.innerHTML = ''

      try {
        const reponse = await ctx.deezer('/search', { q: query, limit: 6 })
        const tracks = reponse?.data || []

        if (tracks.length === 0) {
          searchStatus.textContent = 'AUCUN MORCEAU TROUVÉ.'
          return
        }

        searchStatus.textContent = ''
        searchResults.innerHTML = ''

        tracks.forEach((track) => {
          const coverSmall = track.album?.cover_small || ''
          const itemHtml = `
            <div class="cd-row-item" data-id="${track.id}">
              ${coverSmall ? `<img src="${coverSmall}" class="cd-row-thumb" alt="cover" />` : ''}
              <div class="cd-row-title-pill">${formaterCasseTitre(track.title)} - ${formaterCasseTitre(track.artist?.name || '')}</div>
              <button class="cd-btn-plus" title="Ajouter ce morceau" aria-label="Ajouter">+</button>
            </div>
          `
          searchResults.insertAdjacentHTML('beforeend', itemHtml)
        })

        searchResults.querySelectorAll('.cd-row-item').forEach((item) => {
          const addBtn = item.querySelector('.cd-btn-plus')
          const trackId = Number(item.getAttribute('data-id'))
          const track = tracks.find((t) => t.id === trackId)
          if (!addBtn || !track) return

          addBtn.addEventListener('click', async () => {
            /** @type {HTMLButtonElement} */ (addBtn).disabled = true
            addBtn.textContent = '…'
            try {
              await ctx.shared.add('essais', { deezerId: track.id })
              addBtn.textContent = '✔'
              addBtn.classList.add('is-added')
              searchStatus.textContent = ''
              ctx.state.trackCache.set(track.id, {
                id: track.id,
                title: track.title,
                artist: track.artist?.name || '',
                cover: track.album?.cover_medium || track.album?.cover_small || '',
                preview: track.preview,
              })
            } catch (err) {
              searchStatus.style.color = '#ff6b6b'
              searchStatus.textContent = err.message
              addBtn.textContent = '+'
            } finally {
              /** @type {HTMLButtonElement} */ (addBtn).disabled = false
            }
          })
        })
      } catch (err) {
        searchStatus.style.color = '#ff6b6b'
        searchStatus.textContent = err.message || 'ERREUR DE RECHERCHE.'
      }
    }

    const reinitialiserRecherche = () => {
      if (searchInput) {
        searchInput.value = ''
        searchInput.focus()
      }
      if (searchStatus) {
        searchStatus.textContent = ''
      }
      if (searchResults) {
        searchResults.innerHTML = ''
      }
    }

    if (searchSubmit) searchSubmit.addEventListener('click', executerRecherche)
    if (searchReset) searchReset.addEventListener('click', reinitialiserRecherche)
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executerRecherche()
      if (e.key === 'Escape') reinitialiserRecherche()
    })
  },

  onLost(ctx) {
    if (ctx.state.vinylRoot) {
      ctx.state.vinylRoot.visible = false
    }
  },

  onUpdate(ctx, t, dt) {
    if (ctx.state.turntable && ctx.state.vinylRoot?.visible) {
      const vitesse = ctx.state.isPlaying ? 2.5 : 0.8
      ctx.state.turntable.rotation.z -= dt * vitesse
    }

    if (ctx.state.vinylRoot && ctx.state.vinylRoot.visible) {
      const zBase = ctx.toLocal(0.5, 0.44, 0.28).z
      ctx.state.vinylRoot.position.z = zBase + Math.sin(t * 1.6) * 0.008
    }
  },
}

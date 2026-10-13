// Behavior « lecteur-vinyle » : vinyle 3D noir aux reflets rouges qui flotte au-dessus de l'affiche
// et lecteur audio avec playlist collaborative partagée (liste "essais" via Deezer et ctx.shared).

/** @type {import('../../core/behaviors').Behavior} */
export default {
  onFound(ctx) {
    // -------------------------------------------------------------------------
    // 1. CRÉATION DU VINYLE 3D (au-dessus du centre de l'affiche)
    // -------------------------------------------------------------------------
    if (!ctx.state.vinylRoot) {
      const root = new ctx.THREE.Group()

      // Texture procédurale du vinyle : noir profond, microsillons circulaires et reflets rouges
      const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(512, 512)
        : (window.OffscreenCanvas ? new window.OffscreenCanvas(512, 512) : null)
      const c = canvas ? canvas.getContext('2d') : null
      if (c) {
        c.fillStyle = '#0a0a0c'
        c.fillRect(0, 0, 512, 512)

        // Sillons circulaires
        c.strokeStyle = 'rgba(255, 30, 40, 0.08)'
        c.lineWidth = 1.2
        for (let r = 60; r < 240; r += 3) {
          c.beginPath()
          c.arc(256, 256, r, 0, Math.PI * 2)
          c.stroke()
        }

        // Reflets rouges subtils en dégradé
        const grad = c.createLinearGradient(0, 0, 512, 512)
        grad.addColorStop(0, 'rgba(230, 20, 30, 0.22)')
        grad.addColorStop(0.4, 'rgba(0, 0, 0, 0)')
        grad.addColorStop(0.6, 'rgba(0, 0, 0, 0)')
        grad.addColorStop(1, 'rgba(230, 20, 30, 0.25)')
        c.fillStyle = grad
        c.beginPath()
        c.arc(256, 256, 245, 0, Math.PI * 2)
        c.fill()
      }

      const vinylTexture = canvas ? new ctx.THREE.CanvasTexture(/** @type {any} */ (canvas)) : null

      // Plateau tournant
      const turntable = new ctx.THREE.Group()

      // Épaisseur 3D tangible du CD
      const epaisseur = 0.012
      const rayon = 0.27
      // Trou central transparent agrandi pour voir l'affiche à travers
      const trouRayon = 0.08

      // Tranche extérieure physique du CD (ouverte aux deux extrémités)
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

      // Le petit trou central transparent fait 1/3 du trou actuel (centré dans le trou)
      const petitTrouRayon = trouRayon / 3

      // Tranche intérieure du petit trou central (laisse voir l'affiche)
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

      // Anneau fin métallique rouge sur le contour extérieur
      const rimGeo = new ctx.THREE.TorusGeometry(rayon, 0.0018, 16, 64)
      const rimMat = new ctx.THREE.MeshStandardMaterial({
        color: 0xe61919,
        roughness: 0.25,
        metalness: 0.75,
      })
      const frontRim = new ctx.THREE.Mesh(rimGeo, rimMat)
      frontRim.position.z = epaisseur / 2
      turntable.add(frontRim)

      // Surface centrale entre le petit trou et la cover : 70% opaque noir comme un vrai CD
      const hubGeo = new ctx.THREE.RingGeometry(petitTrouRayon, trouRayon, 64)
      const hubMat = new ctx.THREE.MeshStandardMaterial({
        color: 0x09080a,
        transparent: true,
        opacity: 0.70, // 70 % opaque noir
        roughness: 0.2,
        metalness: 0.5,
        side: ctx.THREE.DoubleSide,
      })
      const hubMesh = new ctx.THREE.Mesh(hubGeo, hubMat)
      hubMesh.position.z = epaisseur / 2 + 0.0006
      turntable.add(hubMesh)

      // Fin liseré rouge bordant le petit trou central entièrement transparent
      const innerRimGeo = new ctx.THREE.TorusGeometry(petitTrouRayon, 0.001, 16, 48)
      const innerRimMat = new ctx.THREE.MeshStandardMaterial({
        color: 0xe61919,
        roughness: 0.3,
        metalness: 0.7,
      })
      const innerRimMesh = new ctx.THREE.Mesh(innerRimGeo, innerRimMat)
      innerRimMesh.position.z = epaisseur / 2 + 0.0008
      turntable.add(innerRimMesh)

      // Fin liseré discret bordant la jonction avec la cover
      const hubBorderGeo = new ctx.THREE.TorusGeometry(trouRayon, 0.0012, 16, 48)
      const hubBorderMesh = new ctx.THREE.Mesh(hubBorderGeo, innerRimMat)
      hubBorderMesh.position.z = epaisseur / 2 + 0.0008
      turntable.add(hubBorderMesh)

      // Face avant : la pochette de l'album sur la surface du CD (hors trou central)
      const labelGeo = new ctx.THREE.RingGeometry(trouRayon, rayon - 0.001, 64)
      const labelMat = new ctx.THREE.MeshBasicMaterial({
        color: 0x881111,
        side: ctx.THREE.DoubleSide,
      })
      const labelMesh = new ctx.THREE.Mesh(labelGeo, labelMat)
      labelMesh.position.z = epaisseur / 2 + 0.0006
      turntable.add(labelMesh)

      // Surface arrière du CD (face optique argentée avec reflets métalliques)
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

      // Position : centre de l'affiche (0.5, 0.44), décollé vers le spectateur (z: 0.28)
      root.position.copy(ctx.toLocal(0.5, 0.44, 0.28))
      // Parallèle à l'affiche (à plat, sans biais)
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
    // 2. CRÉATION DU LECTEUR ET DE L'INTERFACE (ctx.ui)
    // -------------------------------------------------------------------------
    if (ctx.state.uiReady) return
    ctx.state.uiReady = true

    // Cache pour éviter de redemander les morceaux déjà connus à Deezer
    ctx.state.trackCache = new Map()
    ctx.state.playlistTracks = []
    ctx.state.currentIndex = 0
    ctx.state.isPlaying = false

    // Un seul lecteur audio pour toute l'expérience (crossOrigin obligatoire)
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    ctx.state.audio = audio

    const panel = ctx.ui.panel('vinyle-player', { position: 'bottom', keep: true })

    panel.innerHTML = `
      <div class="cd-device-root">
        <!-- PARTIE NOIRE SUPÉRIEURE (DRAWER PLAYLIST) -->
        <div class="cd-drawer is-closed">
          <!-- Petite croix pour fermer -->
          <button class="cd-drawer-close" aria-label="Fermer la playlist" title="Fermer">✕</button>

          <!-- Barre de recherche -->
          <div class="cd-search-capsule">
            <input type="text" class="cd-search-input" placeholder="RECHERCHER..." />
            <button class="cd-search-submit" aria-label="Lancer la recherche" title="Rechercher">🔍</button>
          </div>
          <div class="cd-search-status"></div>

          <!-- Zone noire centrale contenant les résultats ou la playlist -->
          <div class="cd-drawer-content">
            <!-- Résultats de la recherche Deezer -->
            <div class="cd-search-results"></div>

            <!-- Liste des morceaux de la playlist partagée -->
            <div class="cd-playlist-box">
              <div class="cd-playlist-title">MORCEAUX DE L'AFFICHE</div>
              <div class="cd-playlist-items">
                <div class="cd-loading-txt">Chargement de la playlist...</div>
              </div>
            </div>
          </div>
        </div>

        <!-- PLAYER D'ORIGINE (CAPSULE HORIZONTALE) -->
        <div class="cd-capsule-bar">
          <!-- GAUCHE : Cover album identique au CD -->
          <div class="cd-cover-disc" title="Pochette de l'album en cours">
            <img class="cd-cover-img" src="" alt="Cover" />
          </div>

          <!-- CENTRE : Écran LCD rouge défilant + Boutons de contrôle -->
          <div class="cd-middle-console">
            <!-- Écran rouge capsule avec défilement de droite à gauche -->
            <div class="cd-screen-capsule">
              <div class="cd-marquee-wrapper">
                <div class="cd-marquee-track">
                  <span class="cd-marquee-text">CHARGEMENT...</span>
                  <span class="cd-marquee-text-dup">CHARGEMENT...</span>
                </div>
              </div>
            </div>

            <!-- Boutons géométriques rouges : Précédent, Lecture/Pause, Suivant -->
            <div class="cd-controls-row">
              <!-- Précédent -->
              <button class="cd-btn cd-btn-prev" aria-label="Précédent" title="Précédent">
                <svg viewBox="0 0 38 28" class="cd-svg-icon">
                  <polygon points="17,14 36,3 36,25" fill="#df2929" />
                  <polygon points="0,14 19,3 19,25" fill="#df2929" />
                </svg>
              </button>

              <!-- Lecture / Pause -->
              <button class="cd-btn cd-btn-play" aria-label="Lecture ou pause" title="Lecture">
                <svg viewBox="0 0 32 32" class="cd-svg-icon cd-icon-play">
                  <polygon points="4,2 30,16 4,30" fill="#df2929" />
                </svg>
                <svg viewBox="0 0 32 32" class="cd-svg-icon cd-icon-pause" style="display:none;">
                  <rect x="4" y="3" width="8" height="26" fill="#df2929" rx="1" />
                  <rect x="20" y="3" width="8" height="26" fill="#df2929" rx="1" />
                </svg>
              </button>

              <!-- Suivant -->
              <button class="cd-btn cd-btn-next" aria-label="Suivant" title="Suivant">
                <svg viewBox="0 0 38 28" class="cd-svg-icon">
                  <polygon points="19,14 0,3 0,25" fill="#df2929" />
                  <polygon points="36,14 17,3 17,25" fill="#df2929" />
                </svg>
              </button>
            </div>
          </div>

          <!-- DROITE : Bouton PLAYLIST rond noir qui tourne comme le CD -->
          <button class="cd-playlist-btn" aria-label="Ouvrir la playlist" title="PLAYLIST">
            <div class="cd-playlist-dial">
              <svg viewBox="0 0 100 100" class="cd-playlist-svg">
                <path id="curve-playlist" d="M 14,50 A 36,36 0 0,1 86,50" fill="none" />
                <text fill="#df2929" font-family="'Courier New', monospace" font-weight="900" font-size="15" letter-spacing="3.8">
                  <textPath href="#curve-playlist" startOffset="50%" text-anchor="middle">
                    PLAYLIST
                  </textPath>
                </text>
              </svg>
            </div>
          </button>
        </div>
      </div>
    `

    // Styles conformes aux maquettes
    ctx.ui.style(`
      .cd-device-root {
        font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 580px;
        margin: 0 auto;
        box-sizing: border-box;
      }

      /* PARTIE SUPÉRIEURE : DRAWER PLAYLIST */
      .cd-drawer {
        width: 380px;
        max-width: 90vw;
        background: #232225;
        border: 2.5px solid #df2929;
        border-bottom: none;
        border-radius: 28px 28px 0 0;
        padding: 22px 18px 18px;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: -10px;
        z-index: 10;
        box-shadow: 0 -10px 30px rgba(0,0,0,0.65);
        box-sizing: border-box;
      }
      .cd-drawer.is-closed {
        display: none;
      }

      /* Petite croix de fermeture */
      .cd-drawer-close {
        position: absolute;
        top: 8px;
        right: 14px;
        background: transparent;
        border: none;
        color: #df2929;
        font-size: 20px;
        font-weight: 900;
        cursor: pointer;
        padding: 2px 6px;
        line-height: 1;
        transition: transform 0.1s;
      }
      .cd-drawer-close:active {
        transform: scale(0.85);
      }

      /* Barre de recherche RECHERCHER... */
      .cd-search-capsule {
        display: flex;
        align-items: center;
        background: #0c0b0d;
        border-radius: 9999px;
        padding: 8px 16px;
        border: 1px solid rgba(223, 41, 41, 0.4);
      }
      .cd-search-input {
        flex: 1;
        background: transparent;
        border: none;
        color: #df2929;
        font-family: 'Courier New', monospace;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 1.5px;
        outline: none;
        text-transform: uppercase;
      }
      .cd-search-input::placeholder {
        color: #df2929;
        opacity: 0.95;
      }
      .cd-search-submit {
        background: transparent;
        border: none;
        color: #df2929;
        cursor: pointer;
        font-size: 15px;
        padding: 2px;
      }

      .cd-search-status {
        font-size: 11px;
        color: #ff6666;
        text-align: center;
        min-height: 14px;
      }

      /* Contenu intérieur du drawer */
      .cd-drawer-content {
        background: #0c0b0d;
        border-radius: 14px;
        padding: 12px;
        max-height: 220px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .cd-playlist-title {
        font-size: 11px;
        color: #df2929;
        font-weight: 800;
        letter-spacing: 1px;
        margin-bottom: 6px;
        text-align: center;
      }
      .cd-search-results, .cd-playlist-items {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* Lignes items (forme pilule grise + bouton rouge AJOUTER) */
      .cd-row-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
      }
      .cd-row-title-pill {
        background: #2b2b2e;
        border-radius: 9999px;
        padding: 8px 14px;
        color: #ffffff;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: 700;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-transform: uppercase;
      }
      .cd-row-item.is-active .cd-row-title-pill {
        background: #3d1c1c;
        border: 1px solid #df2929;
        color: #ff6666;
      }
      .cd-row-action-btn {
        background: #df2929;
        color: #000000;
        border-radius: 9999px;
        padding: 7px 16px;
        border: none;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
        transition: transform 0.1s, background 0.15s;
      }
      .cd-row-action-btn:active {
        transform: scale(0.92);
      }
      .cd-loading-txt {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        padding: 10px 0;
      }

      /* PARTIE INFÉRIEURE : CAPSULE BAR */
      .cd-capsule-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #1c1c1e;
        border-radius: 9999px;
        padding: 12px 20px;
        width: 540px;
        max-width: 95vw;
        box-shadow: 0 10px 32px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.08);
        position: relative;
        z-index: 20;
        box-sizing: border-box;
      }

      /* GAUCHE : Cover album identique au CD */
      .cd-cover-disc {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        overflow: hidden;
        background: #0c0b0d;
        border: 3px solid #111113;
        box-shadow: 0 4px 12px rgba(0,0,0,0.7);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .cd-cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        display: block;
      }

      /* CENTRE : Console écran + boutons */
      .cd-middle-console {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex: 1;
        padding: 0 16px;
        min-width: 0;
      }

      /* Écran capsule rouge */
      .cd-screen-capsule {
        width: 250px;
        max-width: 100%;
        height: 38px;
        background: #df2929;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        overflow: hidden;
        position: relative;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(223,41,41,0.25);
      }
      .cd-marquee-wrapper {
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        display: flex;
      }
      .cd-marquee-track {
        display: inline-flex;
        white-space: nowrap;
        animation: cd-marquee 12s linear infinite;
      }
      .cd-marquee-text, .cd-marquee-text-dup {
        display: inline-block;
        padding-right: 48px;
        font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
        font-size: 21px; /* Texte plus grand pour cacher certaines lettres et les révéler en défilant */
        font-weight: 900;
        color: #000000;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      @keyframes cd-marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* Rangée des boutons de contrôle géométriques rouges */
      .cd-controls-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 22px;
      }
      .cd-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.1s;
      }
      .cd-btn:active {
        transform: scale(0.9);
      }
      .cd-btn-prev, .cd-btn-next {
        width: 36px;
        height: 26px;
      }
      .cd-btn-play {
        width: 38px;
        height: 38px;
      }
      .cd-svg-icon {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* DROITE : Bouton PLAYLIST rotatif */
      .cd-playlist-btn {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        background: #0c0b0d;
        border: 2px solid #222226;
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
        border-color: #df2929;
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

    // Éléments DOM
    const coverImg = panel.querySelector('.cd-cover-img')
    const marqueeText = panel.querySelector('.cd-marquee-text')
    const marqueeTextDup = panel.querySelector('.cd-marquee-text-dup')
    const playBtn = panel.querySelector('.cd-btn-play')
    const iconPlay = panel.querySelector('.cd-icon-play')
    const iconPause = panel.querySelector('.cd-icon-pause')
    const prevBtn = panel.querySelector('.cd-btn-prev')
    const nextBtn = panel.querySelector('.cd-btn-next')
    const playlistBtn = panel.querySelector('.cd-playlist-btn')
    const playlistDial = panel.querySelector('.cd-playlist-dial')

    const drawer = panel.querySelector('.cd-drawer')
    const closeDrawerBtn = panel.querySelector('.cd-drawer-close')

    const searchInput = panel.querySelector('.cd-search-input')
    const searchSubmit = panel.querySelector('.cd-search-submit')
    const searchStatus = panel.querySelector('.cd-search-status')
    const searchResults = panel.querySelector('.cd-search-results')
    const playlistItemsContainer = panel.querySelector('.cd-playlist-items')

    // Ouvrir / Fermer le volet playlist
    playlistBtn.addEventListener('click', () => {
      drawer.classList.toggle('is-closed')
    })
    closeDrawerBtn.addEventListener('click', () => {
      drawer.classList.add('is-closed')
    })

    // Met à jour le texte défilant dans l'écran LCD rouge
    const updateMarquee = (title, artist) => {
      const text = `${title} - ${artist}`.toUpperCase()
      if (marqueeText) marqueeText.textContent = text
      if (marqueeTextDup) marqueeTextDup.textContent = text
    }

    // Mise à jour de la pochette sur le CD 3D et dans le player
    const update3DVinylCover = (coverUrl) => {
      if (coverImg && coverUrl) {
        coverImg.src = coverUrl
      }
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
    const chargerMorceau = (index, autoPlay = true) => {
      const list = ctx.state.playlistTracks
      if (!list || list.length === 0) return

      ctx.state.currentIndex = (index + list.length) % list.length
      const track = list[ctx.state.currentIndex]
      if (!track) return

      // Met à jour le texte défilant rouge
      updateMarquee(track.title, track.artist)

      // Met à jour la pochette du CD 3D et du rond gauche
      update3DVinylCover(track.cover)

      // Source audio
      audio.src = track.preview

      // Met en surbrillance dans la playlist
      const rows = playlistItemsContainer.querySelectorAll('.cd-row-item')
      rows.forEach((row, i) => {
        row.classList.toggle('is-active', i === ctx.state.currentIndex)
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
          chargerMorceau(ctx.state.currentIndex, true)
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
      chargerMorceau(ctx.state.currentIndex - 1, true)
    })

    nextBtn.addEventListener('click', () => {
      chargerMorceau(ctx.state.currentIndex + 1, true)
    })

    audio.addEventListener('ended', () => {
      chargerMorceau(ctx.state.currentIndex + 1, true)
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

    // Rendu de la liste de lecture (Option B avec design pilules)
    const renderPlaylistItems = () => {
      const tracks = ctx.state.playlistTracks

      if (tracks.length === 0) {
        playlistItemsContainer.innerHTML = '<div class="cd-loading-txt">Aucun morceau dans la playlist. Cherche un titre pour commencer !</div>'
        return
      }

      playlistItemsContainer.innerHTML = ''
      tracks.forEach((track, i) => {
        const itemHtml = `
          <div class="cd-row-item ${i === ctx.state.currentIndex ? 'is-active' : ''}" data-index="${i}">
            <div class="cd-row-title-pill">${track.title} - ${track.artist}</div>
            <button class="cd-row-action-btn cd-btn-play-item">ÉCOUTER</button>
          </div>
        `
        playlistItemsContainer.insertAdjacentHTML('beforeend', itemHtml)
      })

      playlistItemsContainer.querySelectorAll('.cd-row-item').forEach((row) => {
        const playRowBtn = row.querySelector('.cd-btn-play-item')
        if (playRowBtn) {
          playRowBtn.addEventListener('click', () => {
            const idx = Number(row.getAttribute('data-index'))
            chargerMorceau(idx, true)
          })
        }
      })
    }

    // Récupération des infos Deezer pour un morceau donné
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
    // 3. SYNCHRONISATION EN TEMPS RÉEL AVEC LA LISTE PARTAGÉE ("essais")
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
            chargerMorceau(0, false)
          }
        }
        return
      }

      // Charge les infos de chaque morceau
      const results = await Promise.all(deezerIds.map((id) => fetchTrackInfo(id)))
      const validTracks = results.filter((t) => t !== null && Boolean(t.preview))

      if (validTracks.length > 0) {
        ctx.state.playlistTracks = validTracks
        renderPlaylistItems()

        if (!audio.src) {
          chargerMorceau(0, false)
        }
      }
    }, (err) => {
      ctx.log(`Playlist : ${err.message}`)
    })

    // -------------------------------------------------------------------------
    // 4. RECHERCHE DE MORCEAUX SUR DEEZER ET AJOUT DANS "essais"
    // -------------------------------------------------------------------------
    const executerRecherche = async () => {
      const query = searchInput.value.trim()
      if (!query) return

      searchStatus.textContent = 'RECHERCHE SUR DEEZER...'
      searchResults.innerHTML = ''

      try {
        const reponse = await ctx.deezer('/search', { q: query, limit: 5 })
        const tracks = reponse?.data || []

        if (tracks.length === 0) {
          searchStatus.textContent = 'AUCUN MORCEAU TROUVÉ.'
          return
        }

        searchStatus.textContent = ''
        searchResults.innerHTML = ''

        tracks.forEach((track) => {
          const itemHtml = `
            <div class="cd-row-item" data-id="${track.id}">
              <div class="cd-row-title-pill">${track.title} - ${track.artist?.name || ''}</div>
              <button class="cd-row-action-btn cd-btn-add">AJOUTER</button>
            </div>
          `
          searchResults.insertAdjacentHTML('beforeend', itemHtml)
        })

        searchResults.querySelectorAll('.cd-row-item').forEach((item) => {
          const addBtn = item.querySelector('.cd-btn-add')
          const trackId = Number(item.getAttribute('data-id'))
          const track = tracks.find((t) => t.id === trackId)
          if (!addBtn || !track) return

          addBtn.addEventListener('click', async () => {
            /** @type {HTMLButtonElement} */ (addBtn).disabled = true
            addBtn.textContent = 'AJOUT...'
            try {
              await ctx.shared.add('essais', { deezerId: track.id })
              searchStatus.style.color = '#34c759'
              searchStatus.textContent = `✔ « ${track.title} » AJOUTÉ !`
              ctx.state.trackCache.set(track.id, {
                id: track.id,
                title: track.title,
                artist: track.artist?.name || '',
                cover: track.album?.cover_medium || track.album?.cover_small || '',
                preview: track.preview,
              })
              setTimeout(() => { searchStatus.textContent = '' }, 4000)
            } catch (err) {
              searchStatus.style.color = '#ff6b6b'
              searchStatus.textContent = err.message
            } finally {
              /** @type {HTMLButtonElement} */ (addBtn).disabled = false
              addBtn.textContent = 'AJOUTER'
            }
          })
        })
      } catch (err) {
        searchStatus.style.color = '#ff6b6b'
        searchStatus.textContent = err.message || 'ERREUR DE RECHERCHE.'
      }
    }

    if (searchSubmit) searchSubmit.addEventListener('click', executerRecherche)
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executerRecherche()
    })
  },

  onLost(ctx) {
    // Si l'affiche est perdue, le vinyle 3D se cache
    if (ctx.state.vinylRoot) {
      ctx.state.vinylRoot.visible = false
    }
    // L'interface à l'écran reste active grâce à keep: true et la musique continue
  },

  onUpdate(ctx, t, dt) {
    // Rotation continue du disque vinyle (plus rapide quand la musique joue)
    if (ctx.state.turntable && ctx.state.vinylRoot?.visible) {
      const vitesse = ctx.state.isPlaying ? 2.5 : 0.8
      ctx.state.turntable.rotation.z -= dt * vitesse
    }

    // Léger flottement en profondeur pour faire ressortir l'épaisseur et les reflets de la tranche
    if (ctx.state.vinylRoot && ctx.state.vinylRoot.visible) {
      const zBase = ctx.toLocal(0.5, 0.44, 0.28).z
      ctx.state.vinylRoot.position.z = zBase + Math.sin(t * 1.6) * 0.008
    }
  },
}

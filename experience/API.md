# Autorisation API externe : Deezer + playlist partagée

Autorisé par : Arnaud Perrillat le 13 octobre 2026
Projet / groupe : Playlist partagée

## Deezer

- API : Deezer, lecture seule, sans compte ni clé, uniquement avec ctx.deezer() (RULES.md § 4 bis).
- Appels autorisés : /search, /track/{id}, /album/{id}, /artist/{id}, /playlist/{id}, /playlist/{id}/tracks.
- Médias : extraits de 30 s (preview) et pochettes, depuis les CDN dzcdn.net.

## Playlist partagée (ctx.shared)

- Identifiant de partage, à recopier dans experience.json : "shared": "playlist-partagee"
- Listes autorisées : "essais" (pour les tests pendant le travail) et "playlist" (la vraie playlist, montrée au public).
- Contenu : uniquement des deezerId (identifiants de morceaux Deezer).
- Les visiteurs peuvent ajouter, jamais modifier ni supprimer. La modération se fait par l'enseignant.

## Ce qui reste interdit

Connexion d'un utilisateur (OAuth), écriture dans Deezer, clé ou jeton dans le code, serveur ou proxy, tout autre service en ligne.

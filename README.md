# MineHub Manager

Application web locale ou distante pour installer et administrer des serveurs Minecraft Paper, Fabric et Vanilla.

## Fonctions principales

- récupération automatique des versions Paper, Fabric et Vanilla ;
- création des instances, téléchargement du serveur et acceptation explicite de l'EULA ;
- 76 paramètres `server.properties` classés par thème, plus les propriétés personnalisées ;
- réglage de la mémoire Java, du réseau, du monde, des performances, des ressources, de la sécurité et des règles de jeu ;
- démarrage, arrêt, redémarrage, console temps réel et commandes rapides sur le monde ;
- liste des joueurs connectés, opérateurs, joueurs autorisés et bannis ;
- soin, nourriture, élimination, téléportation, mode de jeu, effets, XP, objets, inventaire, point d'apparition, message, expulsion, bannissement, OP et liste blanche ;
- journal d'activité structuré : connexions, déconnexions, morts, PvP, succès, messages, commandes d'administration et cycle du serveur ;
- statistiques par joueur : temps de jeu, morts, kills PvP et mobs, succès, blocs minés, objets fabriqués, distance parcourue, connexions et messages ;
- recherche et installation de mods ou plugins via Modrinth, activation, désactivation et suppression.
- snapshots complets des instances, restauration avec copie de récupération et rétention automatique configurable ;
- thèmes clair et sombre, mémorisés par navigateur ;
- surveillance CPU/RAM du processus Java, mémoire/disque de l’hôte et historique des mesures sur 24 heures.

Les actions joueurs et l'activité temps réel utilisent la console du serveur Minecraft. L'instance doit donc être démarrée pour exécuter une action.

Les statistiques cumulées sont lues dans les fichiers `world/stats` et `world/advancements`. Les sessions, connexions, messages et événements sont comptabilisés par MineHub ; les données natives ne sont disponibles que si Minecraft les a créées pour le monde concerné.

La console conserve les journaux entre les redemarrages, avec recherche, filtres par niveau et export. Les fichiers sont stockes dans `data/logs` (ou sous `MINECRAFT_ROOT/logs`), avec rotation automatique et hors des sauvegardes de mondes.
La page Mods & plugins peut verifier les versions Modrinth compatibles et mettre a jour les projets installes individuellement ou en groupe. Le serveur doit etre arrete avant toute modification des fichiers de mods.

## Lancement local

Prérequis : Node.js 20 ou plus récent et une version de Java compatible avec la version Minecraft choisie. La page **Surveillance** affiche les versions détectées et signale les composants absents ou trop anciens. MineHub utilise la commande `java` du PATH, ou le chemin configuré avec `JAVA_HOME` / `JAVA_PATH`.

```powershell
npm.cmd start
```

Ouvrir ensuite `http://127.0.0.1:4173`.

Sous Windows, lancer **Lancer MineHub.cmd** ou le raccourci **MineHub Manager** du Bureau. Le lanceur ouvre l'interface si MineHub tourne déjà, sinon il démarre l'agent en arrière-plan. Les journaux de démarrage sont écrits dans `%LOCALAPPDATA%\MineHub\logs`.

Les instances, leur configuration, les événements et les mods sont stockés par défaut dans `data/servers`. Un autre emplacement peut être choisi avec `MINECRAFT_ROOT`, ou dans **Paramètres généraux** depuis l'interface. Le changement de dossier copie les instances existantes, conserve l'ancien dossier comme copie de secours et exige l'arrêt de tous les serveurs. Les sauvegardes, journaux et mesures MineHub restent dans le dossier de données.
Les snapshots sont conservés dans `data/backups` (ou dans `MINECRAFT_BACKUP_ROOT`) et l’historique de surveillance dans `data/metrics`.

## Sauvegardes et surveillance

La page **Sauvegardes** crée une copie complète des fichiers d’une instance. Pour une instance en ligne, MineHub suspend l’écriture automatique du monde, force une sauvegarde, copie les fichiers, puis réactive l’écriture. Les sauvegardes planifiées peuvent être configurées de toutes les 6 heures à une fois par semaine, avec une rétention de 1 à 20 copies.

La restauration exige que le serveur soit arrêté et que la sauvegarde corresponde à la même version et distribution. MineHub crée une sauvegarde `Avant restauration` avant de remplacer les fichiers. Les mesures CPU/RAM Java sont échantillonnées chaque minute; l’espace disque et la mémoire de l’hôte sont actualisés à l’ouverture de la page Surveillance.

## Installation Linux avec systemd

L'exemple suivant utilise l'utilisateur système `minehub`, l'application dans `/opt/minehub` et les instances dans `/srv/minecraft`.

```bash
sudo useradd --system --home /opt/minehub --shell /usr/sbin/nologin minehub
sudo mkdir -p /opt/minehub /srv/minecraft
sudo cp -a . /opt/minehub/
sudo chown -R minehub:minehub /opt/minehub /srv/minecraft
```

Créer `/etc/systemd/system/minehub.service` :

```ini
[Unit]
Description=MineHub Minecraft Manager
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=minehub
Group=minehub
WorkingDirectory=/opt/minehub
Environment=NODE_ENV=production
Environment=HOST=0.0.0.0
Environment=PORT=4173
Environment=MINECRAFT_ROOT=/srv/minecraft
Environment=MCM_TOKEN=REMPLACER_PAR_UN_LONG_JETON_ALEATOIRE
ExecStart=/usr/bin/node /opt/minehub/server.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/srv/minecraft /opt/minehub/data

[Install]
WantedBy=multi-user.target
```

Puis activer le service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minehub
sudo systemctl status minehub
sudo journalctl -u minehub -f
```

Une erreur `EACCES: permission denied, mkdir '/srv/minecraft'` signifie que le compte défini par `User=` n'a pas les droits sur le dossier. La commande suivante corrige le propriétaire :

```bash
sudo mkdir -p /srv/minecraft
sudo chown -R minehub:minehub /srv/minecraft
sudo systemctl restart minehub
```

Si le chemin configuré est `/srv/minecraf` sans le dernier `t`, corriger également `MINECRAFT_ROOT` dans le service.

## Acces des amis sans port forwarding

La page **Acces amis** accompagne la creation d'un tunnel Playit Minecraft Java. Installez et laissez tourner l'agent Playit sur la machine qui heberge le serveur, creez un tunnel Java vers `127.0.0.1:<port du serveur>`, puis enregistrez l'adresse publique dans MineHub pour la copier et la partager. Les joueurs se connectent avec cette adresse depuis Minecraft; ils n'installent pas l'agent et aucun port entrant n'est a ouvrir sur le routeur.

## Connexion distante

Dans MineHub, ouvrir le sélecteur de connexion, choisir **Serveur distant**, puis saisir l'URL de l'agent et le jeton `MCM_TOKEN`. Placer idéalement MineHub derrière un proxy HTTPS et ne jamais exposer un agent sans jeton sur Internet.

Pour une installation uniquement locale, conserver `HOST=127.0.0.1`. Le port Minecraft de chaque instance doit aussi être autorisé dans le pare-feu si des joueurs externes doivent se connecter.

## Sources utilisées

- Paper : service de téléchargement officiel PaperMC v3 ;
- Fabric : Fabric Meta API v2 ;
- Vanilla : manifeste officiel Mojang ;
- mods et plugins : API Modrinth v2.

## Securite distante et mises a jour

Un agent lie a une adresse reseau autre que localhost refuse de demarrer sans `MCM_TOKEN` d'au moins 32 caracteres. Generez un jeton avec `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`, puis placez l'agent derriere un proxy HTTPS. MineHub refuse les connexions distantes en HTTP (sauf localhost). Le jeton est un acces administrateur unique; ne le partagez pas et ne l'exposez jamais dans un depot.

La page **Mises a jour** compare la version installee a la derniere version stable. L'application cree une sauvegarde complete avant la mise a jour. Pour appliquer une mise a jour ou revenir en arriere, arretez d'abord le serveur. Le retour arriere restaure aussi les fichiers de configuration sauvegardes.

La page **Joueurs** montre maintenant les fichiers `ops.json`, `whitelist.json` et `banned-players.json`, y compris serveur arrete. En ligne, les changements passent par les commandes serveur; hors ligne, MineHub met a jour les fichiers vanilla. Les comptes en ligne mode utilisent leur profil Mojang; les comptes hors ligne utilisent l'UUID Minecraft hors ligne.

La création d'une instance génère `server.properties`, télécharge la distribution sélectionnée et prépare les dossiers `mods` ou `plugins`. Les fichiers `minehub-events.jsonl` conservent l'activité structurée de chaque instance.

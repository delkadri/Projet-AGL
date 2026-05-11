# Flux temps réel des messages de groupe

## Vue d'ensemble

```
┌──────────┐    1. POST /groups/:id/messages    ┌──────────┐
│ Client A │ ─────────────────────────────────► │ NestJS   │
│ (auteur) │                                    │ Backend  │
└──────────┘                                    └────┬─────┘
                                                     │
                                       2. Vérif membre + persist Prisma
                                                     │
                                                     ▼
                                            ┌────────────────┐
                                            │   PostgreSQL   │
                                            │ group_messages │
                                            └────────────────┘
                                                     │
                                                     │ 3. broadcast
                                                     ▼
                                            ┌────────────────────┐
                                            │ Supabase Realtime  │
                                            │ channel:           │
                                            │  group:{groupId}   │
                                            └─────────┬──────────┘
                                                      │ 4. push WS
                  ┌───────────────────────────────────┼──────────┐
                  ▼                                   ▼          ▼
            ┌──────────┐                       ┌──────────┐  ┌──────────┐
            │ Client A │                       │ Client B │  │ Client C │
            │ (abonné) │                       │ (abonné) │  │ (abonné) │
            └──────────┘                       └──────────┘  └──────────┘
```

## Étapes en détail

**1. Envoi (REST classique)**
Le client A fait `POST /groups/:id/messages` avec son JWT Supabase dans le header. Pas de WebSocket pour ça — c'est une requête HTTP normale.

**2. Validation + persistance**
`SupabaseAuthGuard` valide le JWT → `ChatService.sendMessage` :
- `assertIsMember` vérifie que l'utilisateur est dans `group_members` (sinon 403).
- Prisma insère la ligne dans `group_messages` avec `user_id`, `group_id`, `content`.
- Le message persisté (avec l'objet `user`) est retourné dans la réponse HTTP au client A.

**3. Broadcast**
Avant de retourner, le backend appelle :
```ts
supabase.channel(`group:${groupId}`).send({
  type: 'broadcast',
  event: 'new_message',
  payload: message,
})
```
Cet appel ouvre (ou réutilise) une connexion vers le serveur Supabase Realtime et lui dit *"envoie ce payload à tous les clients abonnés au channel `group:{id}` avec l'event `new_message`"*.

**4. Distribution WebSocket**
Supabase Realtime gère la partie WS pour nous. Chaque client (A, B, C) a préalablement fait côté frontend :
```ts
supabase.channel(`group:${groupId}`)
  .on('broadcast', { event: 'new_message' }, ({ payload }) => { ... })
  .subscribe()
```
→ ça ouvre **une connexion WebSocket persistante** vers `wss://<project>.supabase.co/realtime/v1/...`, multiplexée sur tous les channels auxquels le client est abonné.

Quand Supabase reçoit le broadcast du backend, il pousse l'event à tous les sockets abonnés au channel `group:{id}`. Les handlers `.on('broadcast', ...)` se déclenchent côté client → le nouveau message apparaît dans l'UI sans refresh.

## Points clés

- **Le WebSocket existe**, mais il est géré par Supabase, pas par toi. NestJS ne maintient aucune connexion socket.
- **Double trajet pour l'auteur** : il reçoit son message une fois via la réponse HTTP du POST, et une seconde fois via le broadcast. À toi de gérer la dédup côté frontend (par `message.id`) ou de l'ignorer si tu update l'UI immédiatement en optimistic.
- **Persistance et temps réel sont découplés** : si Supabase Realtime tombe, le message est quand même en base (le `broadcast` log un warning mais ne fait pas échouer le POST). Au prochain `GET /messages`, l'historique sera complet.
- **Sécurité** : l'écriture/lecture est protégée par le guard NestJS + `assertIsMember`. Le channel broadcast lui-même est ouvert — quelqu'un qui devine le `groupId` peut écouter (mais ne peut ni écrire ni lire l'historique sans token).
- **Pas de "rooms" à gérer côté backend** : Supabase Realtime fait le routage par nom de channel.

---

## Référence API

### `GET /groups/:id/messages`

Historique paginé, ordre décroissant. Protégé par `SupabaseAuthGuard` + check d'appartenance.

Query :
- `limit` (1–100, défaut 50)
- `before` (ISO 8601) — retourne les messages strictement antérieurs

Réponse :
```json
{
  "messages": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "user_id": "uuid",
      "content": "Salut !",
      "created_at": "2026-05-11T12:34:56.000Z",
      "user": { "id": "uuid", "first_name": "Alice", "last_name": "Dupont" }
    }
  ],
  "nextCursor": "2026-05-11T12:00:00.000Z"
}
```

Page suivante : `GET /groups/:id/messages?before={nextCursor}`. `nextCursor` est `null` quand la fin de l'historique est atteinte.

### `POST /groups/:id/messages`

Body : `{ "content": "Salut !" }` (max 2000 caractères).

Renvoie le message persisté (même forme que dans `GET`) et déclenche le broadcast Realtime.

## Modèle de données

Table `group_messages` :

| Colonne     | Type        | Description                              |
|-------------|-------------|------------------------------------------|
| `id`        | uuid        | PK                                       |
| `group_id`  | uuid (FK)   | Groupe destinataire                      |
| `user_id`   | uuid (FK)   | Auteur                                   |
| `content`   | text        | Contenu du message (max 2000 caractères) |
| `created_at`| timestamptz | UTC, défaut DB                           |

Index composite `(group_id, created_at)` pour la pagination par curseur.

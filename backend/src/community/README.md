# Community module

Gestion des groupes, défis hebdomadaires et chat temps réel.

## Chat de groupe (TER-49)

### Modèle de données

Table `group_messages` (Prisma model `group_messages`) :

| Colonne     | Type        | Description                              |
|-------------|-------------|------------------------------------------|
| `id`        | uuid        | PK                                       |
| `group_id`  | uuid (FK)   | Groupe destinataire                      |
| `user_id`   | uuid (FK)   | Auteur                                   |
| `content`   | text        | Contenu du message (max 2000 caractères) |
| `created_at`| timestamptz | UTC, défaut DB                           |

Index composite `(group_id, created_at)` pour la pagination par curseur.

### Endpoints REST

Tous protégés par `SupabaseAuthGuard` et réservés aux membres du groupe (403 sinon).

#### `GET /groups/:id/messages`

Historique paginé, ordre décroissant.

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

Pour récupérer la page suivante : `GET /groups/:id/messages?before={nextCursor}`. `nextCursor` est `null` quand la page n'est pas pleine (fin de l'historique).

#### `POST /groups/:id/messages`

Body : `{ "content": "Salut !" }`.

Le backend :
1. Vérifie l'appartenance au groupe.
2. Persiste le message via Prisma.
3. Diffuse l'event `new_message` sur le channel Supabase Realtime `group:{id}`.

Renvoie le message persisté (même forme que dans `GET`).

### Abonnement Realtime côté client

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const channel = supabase
  .channel(`group:${groupId}`)
  .on('broadcast', { event: 'new_message' }, ({ payload }) => {
    // payload est le message persisté (avec user)
    appendMessage(payload)
  })
  .subscribe()

// au démontage :
supabase.removeChannel(channel)
```

### Sécurité

L'accès à l'historique (`GET`) et l'écriture (`POST`) sont protégés côté NestJS par `SupabaseAuthGuard` + un check d'appartenance (`group_members`).

⚠️ Le channel de broadcast Supabase est **public** : un client qui devine `groupId` peut s'abonner et recevoir les events temps réel. Les actions d'écriture restent impossibles sans token valide et appartenance au groupe. Si la confidentialité du contenu temps réel devient critique, basculer sur des Postgres Changes + policies RLS.

### Migrations

```bash
cd backend
npx prisma migrate dev --name add_group_messages
```

# CollabSpace — Full Codebase Analysis

## Overview
CollabSpace adalah aplikasi messaging real-time mirip Slack, dibangun di atas **Next.js App Router** dengan TypeScript. Fitur utama: channel messaging, direct messaging (DM), user presence, reactions, reply, pin, mention, image upload, dan unread tracking.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via **Prisma** (generated ke `src/generated/prisma`) |
| Auth | **Better Auth** (`@/lib/auth`, `@/lib/auth-client`) |
| Real-time | **SSE (Server-Sent Events)** — in-memory, bukan WebSocket/Redis |
| Rate Limiting | **Upstash Redis** (`@upstash/ratelimit`, sliding window) |
| File Upload | **UploadThing** |
| UI | **shadcn/ui** + Tailwind CSS |
| Package Manager | **Bun** (`bun dev`) |

---

## Database Schema (Prisma)

### Model Utama

```
User
├── status: UserStatus (online|away|busy|offline)
├── channelMembers → ChannelMember[]
├── messages → Message[]
├── conversationsAsOne/AsTwo → Conversation[]
├── directMessages → DirectMessage[]
├── channelReads → ChannelRead[]
├── conversationReads → ConversationRead[]
├── messageReactions → MessageReaction[]
├── directMessageReactions → DirectMessageReaction[]
├── pinnedMessages → PinnedMessage[]
└── mentions → Mention[]

Channel
├── channelMembers → ChannelMember[]
├── messages → Message[]
├── channelReads → ChannelRead[]
├── pinnedMessages → PinnedMessage[]
└── mentions → Mention[]

Message (channel)
├── content: String?
├── images: String[]
├── replyToId → Message? (self-referential)
├── messageReactions → MessageReaction[]
├── pinnedMessages → PinnedMessage[]
└── mentions → Mention[]

Conversation (DM antara 2 user)
├── memberOneId + memberTwoId → User
├── directMessages → DirectMessage[]
└── conversationReads → ConversationRead[]

DirectMessage
├── content, images, replyToId
├── conversationId → Conversation
└── directMessageReactions → DirectMessageReaction[]

Mention
├── userId, messageId, channelId
└── read: Boolean (default false)
```

---

## Arsitektur Real-time (SSE)

App menggunakan **3 SSE streams** berbeda, semua in-memory:

### 1. Channel/DM SSE (`/api/sse?channelId=...`)
- **Lib:** `src/lib/sse.ts` — `Map<channelId, Set<Controller>>`
- **Subscribe:** `addSubscriber(channelId, controller)`
- **Broadcast:** `broadcastToChannel(channelId, data)`
- **Events yang dikirim:**
  - `new-message` → pesan baru (channel atau DM menggunakan prefix `dm-${conversationId}`)
  - `typing` → indikator mengetik (DM only)
  - `message-updated` → edit pesan
  - `message-deleted` → hapus pesan
  - `reaction-updated` → update emoji reaction
  - `pin-updated` → pin/unpin pesan
- **Hook client:** `useChannelSSE(channelId, onNewMessage, onTyping, ...)` di `src/hooks/use-channel-sse.ts`

### 2. Notifications SSE (`/api/notifications`)
- **Lib:** `src/lib/user-notifications.ts` — `Map<userId, Set<Controller>>`
- **Subscribe:** per-user (bukan per-channel)
- **Events yang dikirim:**
  - `new-channel-message` → ada pesan baru di channel yang diikuti (untuk update unread count)
  - `new-dm-message` → ada DM baru (untuk update unread count)
  - `mention` → user di-mention di suatu channel
- **Consumed by:** `useUnread()` hook di `src/hooks/use-unread.tsx`

### 3. Presence SSE (`/api/presence`)
- **Lib:** `src/lib/presence.ts` — `Map<userId, count>` + `Map<userId, status>`
- **Subscribe:** saat user connect, `userConnected(userId, status, controller)` dipanggil
- **Disconnect:** saat browser close, `userDisconnected(userId, controller)` (mendukung multi-tab via counter)
- **Broadcast payload:** `{ type: "presence", onlineUserIds: string[], userStatuses: Record<string, string> }`
- **Consumed by:** `usePresence()` hook di `src/hooks/use-presence.tsx`

---

## Alur Data: Kirim Pesan Channel

```
User ketik → Enter
  │
  ▼
handleSend() [channel-view.tsx]
  ├── Buat tempId (UUID)
  ├── Optimistic update: tambah pesan sementara ke state
  ├── POST /api/messages { channelId, content, images, clientId: tempId, replyToId }
  │     ├── Auth check
  │     ├── Rate limit check (Upstash Redis: 20 msg / 10s)
  │     ├── Prisma: message.create (include user, replyTo, reactions)
  │     ├── Parse @mentions → buat Mention records + broadcastToUser(userId, "mention")
  │     ├── broadcastToUser(memberId, "new-channel-message") → semua member lain
  │     └── broadcastToChannel(channelId, { type: "new-message", message, clientId: tempId })
  │
  ▼
useChannelSSE onmessage: "new-message"
  └── handleNewMessage(message, clientId)
        └── Jika clientId match tempId → replace optimistic, else append
```

## Alur Data: Kirim DM

```
User ketik → Enter
  │
  ▼
handleSend() [dm-view.tsx]
  ├── Optimistic update dengan tempId
  ├── POST /api/dm { conversationId, content, images, clientId, replyToId }
  │     ├── Auth + rate limit check
  │     ├── Verifikasi user adalah member conversation
  │     ├── Prisma: directMessage.create
  │     ├── broadcastToUser(otherUser, "new-dm-message") → untuk unread counter
  │     └── broadcastToChannel("dm-${conversationId}", { type: "new-message", message, clientId })
  │
  ▼
DmView.useChannelSSE dengan channelId = "dm-${conversationId}"
  └── handleNewMessage → replace optimistic atau append
```

---

## Komponen Utama

### `ChannelView` (`src/features/channels/components/channel-view.tsx`) — 1073 baris
State yang dikelola:
- `messages` — daftar pesan (initial dari server, real-time via SSE)
- `input` — teks input
- `pendingImages` — gambar yang belum selesai upload
- `replyingTo` — pesan yang di-reply
- `mentionQuery` — query autocomplete @mention
- `pinnedIds` — Set ID pesan yang dipinned
- `showPinnedPanel` — toggle panel pinned messages
- `cursor`, `hasMore` — state pagination
- `isAtBottomRef` — untuk smart auto-scroll

Fitur:
- ✅ Optimistic updates dengan tempId
- ✅ Cursor-based pagination (load more ke atas)
- ✅ Smart scroll (tidak paksa scroll saat user baca atas)
- ✅ Date separator (Today/Yesterday/Tanggal)
- ✅ @mention autocomplete dropdown
- ✅ Emoji reactions dengan tooltip nama user
- ✅ Reply, Edit, Delete (dengan AlertDialog konfirmasi)
- ✅ Pin/Unpin pesan
- ✅ Image upload (max 4) via UploadThing
- ✅ Highlight message dari URL query `?highlight=messageId`

### `DmView` (`src/features/dm/components/dm-view.tsx`) — 891 baris
Sama dengan ChannelView + tambahan:
- ✅ Typing indicator (`isOtherTyping`) — kirim `POST /api/typing` dengan debounce 2000ms
- ✅ SSE subscribe ke `"dm-${conversationId}"` (bukan channel ID biasa)
- ✅ Read receipt: `markConversationRead(conversationId)` saat masuk halaman

---

## Context & Providers

### `PresenceProvider` + `usePresence()`
- Wrap di `(protected)/layout.tsx`
- Subscribe ke `/api/presence` SSE
- Return: `{ onlineUserIds: Set<string>, userStatuses: Map<string, string> }`
- Dipakai di `SidebarDirectMessages` untuk tampilkan dot status warna

### `UnreadProvider` + `useUnread()`
- Wrap di `(protected)/layout.tsx`
- Initial state dari server: `channelUnread`, `conversationUnread`, `mentionedChannels`
- Subscribe ke `/api/notifications` SSE
- Logic: jika user sedang di halaman channel/DM yang bersangkutan → mark read, jika tidak → increment unread
- Methods: `markChannelRead(id)`, `markConversationRead(id)`, `clearChannelMentions(id)`
- `markChannelRead` memanggil `POST /api/channels/${id}/read` untuk sync ke DB
- `clearChannelMentions` memanggil `POST /api/channels/${id}/mentions/read`
- Dipakai di `SidebarChannels` dan `SidebarDirectMessages` untuk badge unread

---

## Route Pages (App Router)

```
app/
├── page.tsx                          → Redirect ke /dashboard atau /sign-in
├── (auth)/                           → Sign in / Sign up pages
├── onboarding/                       → Halaman set username setelah register
└── (protected)/                      → Layout dengan sidebar + providers
    ├── layout.tsx                    → Fetch data awal + wrap semua provider
    ├── dashboard/page.tsx            → Halaman utama/landing
    ├── channels/[channelId]/page.tsx → Halaman channel (server component)
    ├── dm/[id]/page.tsx              → Halaman DM (server component)
    └── settings/page.tsx             → Settings profil
```

### `(protected)/layout.tsx` — Entry Point
Parallel fetch di server:
1. `getUserChannels()` — channel yang diikuti user
2. `getUserConversations()` — DM conversations
3. `getChannelUnreadCounts()` — jumlah unread per channel
4. `getConversationUnreadCounts()` — jumlah unread per conversation
5. `getUnreadMentions()` — daftar mention yang belum dibaca

Kemudian render:
```
TooltipProvider
  └── SidebarProvider
        └── PresenceProvider
              └── UnreadProvider (initial data dari server)
                    ├── AppSidebar
                    └── {children}
```

---

## Sidebar

### `SidebarChannels`
- Daftar channel user
- Badge unread count (max 99+)
- Badge `@` biru jika ada mention
- Link ke `/channels/${id}?highlight=${firstMentionId}` jika ada mention
- Tombol Create Channel + Browse Channels

### `SidebarDirectMessages`
- Daftar DM conversations
- Avatar + status dot (warna sesuai status: green/yellow/red/gray)
- Badge unread count
- Tombol New DM

### `SidebarFooterSection`
- Avatar user + status dot
- Dropdown untuk ganti status (Online/Away/Busy/Appear Offline)
- `handleStatusChange` → `PATCH /api/users/status` → update DB + `updateUserStatus()` → broadcast presence SSE
- Link ke Settings

---

## API Routes

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/api/messages` | Kirim pesan channel (rate-limited) |
| PATCH | `/api/messages/[id]` | Edit pesan channel |
| DELETE | `/api/messages/[id]` | Hapus pesan channel |
| POST | `/api/messages/[id]/reactions` | Toggle emoji reaction |
| POST | `/api/messages/[id]/pin` | Toggle pin pesan |
| GET | `/api/channels/[id]/messages?cursor=` | Load more (pagination) |
| GET | `/api/channels/[id]/pinned` | Daftar pinned messages |
| POST | `/api/channels/[id]/read` | Mark channel sebagai read |
| POST | `/api/channels/[id]/mentions/read` | Mark mentions sebagai read |
| POST | `/api/dm` | Kirim DM (rate-limited) |
| PATCH | `/api/dm/[id]` | Edit DM |
| DELETE | `/api/dm/[id]` | Hapus DM |
| POST | `/api/dm/[id]/reactions` | Toggle DM reaction |
| GET | `/api/dm/conversations/[id]/messages?cursor=` | Load more DM |
| PATCH | `/api/users/status` | Update status user |
| POST | `/api/typing` | Broadcast typing event ke SSE |
| GET | `/api/sse?channelId=` | SSE stream untuk channel/DM |
| GET | `/api/notifications` | SSE stream notifikasi per user |
| GET | `/api/presence` | SSE stream presence global |
| GET | `/api/channels` | List semua channels (browse) |
| POST | `/api/channels` | Buat channel baru |
| POST | `/api/channels/[id]/join` | Join channel |
| DELETE | `/api/channels/[id]/leave` | Leave channel |
| * | `/api/auth/*` | Better Auth handler |
| * | `/api/uploadthing` | UploadThing handler |

---

## Pagination Pattern

- **Strategy:** Cursor-based (bukan offset)
- **Limit:** `PAGINATION_LIMIT = 5` (di `src/constants/index.ts`)
- **Flow:**
  1. Server fetch: `orderBy: createdAt DESC, take: LIMIT` → reverse di query → kirim sebagai urutan kronologis
  2. Initial cursor: `messages[0].id` (pesan tertua yang ditampilkan)
  3. Load more: `GET /api/channels/[id]/messages?cursor=<oldestId>` → prepend ke atas
  4. Preserve scroll position: simpan `scrollHeight` sebelum load, restore `scrollTop += (newScrollHeight - prevScrollHeight)`

---

## Fitur Channel Management

- **Create:** `CreateChannelDialog` → Server Action `createChannel()`
- **Browse:** `BrowserChannelsDialog` → fetch semua channels, bisa join
- **Leave:** `LeaveChannelButton` → Server Action `leaveChannel()`
- **Member panel:** `ChannelMemberPanel` — tampilkan daftar member dengan status dot (via `usePresence()`)

---

## Pola Optimistic Update

Semua operasi kirim/edit/delete/react menggunakan optimistic update:
1. Update state lokal **sebelum** API call
2. Jika API gagal → rollback state
3. Untuk pesan baru: gunakan `clientId` (tempId) untuk dedup saat SSE event kembali

---

## Rate Limiting

- File: `src/lib/rate-limit.ts`
- Upstash Redis + Sliding Window
- Config: `limit: 20, windowMs: 10_000` (20 pesan per 10 detik)
- Dipakai di: `POST /api/messages` dan `POST /api/dm`
- Return `{ success: boolean }`, jika false → response 429

---

## Catatan Penting

1. **SSE adalah in-memory** — jika server restart, semua koneksi putus dan reconnect otomatis (browser behavior)
2. **Multi-tab support** di presence: counter `onlineUsers.set(userId, count + 1)`, baru hapus kalau count = 0
3. **DM SSE channel ID** menggunakan prefix `"dm-${conversationId}"` untuk menghindari konflik dengan channel biasa
4. **`session.user.status`** tersedia di client via Better Auth (karena field ada di User table)
5. **Typing indicator** hanya di DM, belum di channel (ada di backlog)
6. **`PAGINATION_LIMIT = 5`** sangat kecil — mungkin perlu dinaikkan untuk production

---

## Backlog Fitur (dari KI)

| Feature | Priority |
|---|---|
| Profile card (klik avatar → popup + DM button) | High |
| Global search (lintas channel & DM) | High |
| Channel management (rename/delete) | High |
| Member management (add/remove) | Medium |
| Typing indicator di channel | Low |
| Read receipt DM ("Seen") | Medium |
| Thread view (side panel) | High |
| Browser push notification | High |
| Notification settings per channel | Medium |

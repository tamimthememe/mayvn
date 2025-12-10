# Data Representations

This document inventories the data that is persisted locally, in Firestore, in local filesystem JSON, and in in-memory mocks, plus what each structure is for.

## Firestore

### `users/{uid}`
- **Purpose:** Profile for authenticated user.
- **Shape:**
  - `uid: string`
  - `email: string`
  - `name: string`
  - `experience?: string`
  - `createdAt?: timestamp`
  - `updatedAt?: timestamp`

### `users/{uid}/brands/{brandId}`
- **Purpose:** A brand owned by the user; holds identity and social metadata.
- **Shape:**
  - `id?: string` (doc id, when returned client-side)
  - `brand_name: string`
  - `tagline?: string`
  - `brand_values?: string[]`
  - `business_overview?: string`
  - `colors?: string[]`
  - `fonts?: string[]`
  - `images?: string[]`
  - `logo?: { logo: string; logo_small: string }`
  - `main_font?: string`
  - `accent_color?: string`
  - `target_audience?: string[]`
  - `tone_of_voice?: string[]`
  - `platforms: string[]`
  - `goals: string[]`
  - `company?: string`
  - `redditChallenge?: string`
  - `redditUsername?: string`
  - `isRedditVerified?: boolean`
  - `createdAt?: timestamp`
  - `updatedAt?: timestamp`

### `users/{uid}/brands/{brandId}/posts/{postId}`
- **Purpose:** Drafted/scheduled/published posts per brand.
- **Shape:**
  - `id?: string`
  - `title: string`
  - `caption?: string`
  - `image?: string`
  - `status: "draft" | "scheduled" | "published"`
  - `frames?: any[]` (legacy nested frames)
  - `framesJson?: string` (preferred serialized frames)
  - `createdAt?: timestamp`
  - `updatedAt?: timestamp`

### `users/{uid}/brands/{brandId}/instagram_accounts/{instagramUserId}`
- **Purpose:** Connected Instagram account credentials/state for a brand.
- **Shape:**
  - `instagramUserId: string`
  - `username: string`
  - `name?: string`
  - `profilePictureUrl?: string`
  - `accessToken?: string`
  - `accessTokenEncrypted?: string`
  - `tokenExpiresAt?: number` (ms epoch)
  - `connectedAt: Date`
  - `isActive?: boolean`

### `users/{uid}/brands/{brandId}/comment_check_state/latest`
- **Purpose:** Deduplication state for polling Instagram comments.
- **Shape:**
  - `lastCheckedAt: timestamp | null`
  - `checkedCommentIds: string[]`

### `users/{uid}/notifications/{notificationId}`
- **Purpose:** User notifications (engagement, content, system).
- **Shape:**
  - `id: string`
  - `userId: string`
  - `brandId?: string`
  - `type: "success" | "info" | "warning" | "engagement" | "content" | "analytics" | "comment"`
  - `title: string`
  - `message: string`
  - `timestamp: timestamp`
  - `read: boolean`
  - `actionUrl?: string`
  - `icon?: "instagram" | "sparkles" | "trending" | "calendar" | "message" | "heart" | "alert" | "comment"`
  - `metadata?: { postId?: string; commentId?: string; commentText?: string; commenterUsername?: string; mediaUrl?: string }`

### `users/{uid}/settings/preferences`
- **Purpose:** User-configurable settings and notification toggles.
- **Shape:**
  - `notifications: { comments: boolean; marketing: boolean; security: boolean; updates: boolean }`
  - `theme?: "light" | "dark" | "system"`

## Local filesystem JSON

### `data/post-projects.json`
- **Purpose:** Stores saved visual post projects (frames) on disk via API route.
- **Shape:**
  - `id: string`
  - `title: string`
  - `brandId?: string`
  - `frames: Array<{ id: string; typeId: string; x: number; y: number; name?: string; content?: { image?: string; text?: string }; styles?: object; connections?: { parentId?: string; childIds?: string[] } }>`
  - `createdAt: string` (ISO)
  - `updatedAt: string` (ISO)

## Browser storage

### `localStorage`
- `brandDNA`: Brand identity blob saved during scraping/onboarding.
  - Fields mirror brand DNA: `brand_name`, `tagline`, `brand_values`, `business_overview`, `colors`, `fonts`, `images`, `logo`, `main_font`, `accent_color`, `target_audience`, `tone_of_voice`.
- `selectedBrandId_${uid}`: Currently selected brand id per user.

### `sessionStorage`
- `mayvn_analytics_${brandId}_${igUserId|default}`: Cached Instagram analytics payload.
  - `{ data: <insights response>, timestamp: number(ms) }`

## In-memory (dev mock)

### `_analytics-feature` global stores
- **Purpose:** Dev-only mock DB for Instagram auth/connection flows.
- **Structures (all Maps keyed by userId):**
  - `__instagramCredentials`: `{ userId, clientId, clientSecretEncrypted, createdAt: Date, updatedAt: Date }`
  - `__instagramTokens`: `{ userId, instagramUserId, accessTokenEncrypted, tokenType: "short_lived"|"long_lived", expiresAt: Date, createdAt: Date }`
  - `__instagramAccounts`: `{ userId, instagramUserId, username, profilePictureUrl?, accountType: "BUSINESS"|"CREATOR"|"PERSONAL", isConnected: boolean, connectedAt: Date }`

## Python service models (image generation)

### `GenerateRequest`
- **Purpose:** Input for image generation/LoRA composition.
- **Fields (Pydantic):** `prompt`, `negative_prompt?`, `width`, `height`, `num_inference_steps`, `brand_id?` (deprecated), `lora_weights?` (deprecated), `brand_data?`, `lora_configs?` (array of `LoRAConfig`), `test_weights`, `weight_variations?`.

### `LoRAConfig`
- **Purpose:** Config for a single LoRA adapter.
- **Fields:** `brand_id`, `weight`, `type?`.

### `GenerateResponse`
- **Purpose:** Result of generation job.
- **Fields:** `success`, `image_base64?`, `image_url?`, `message?`, `mock`, `device?`.

### `JobStatusResponse`
- **Purpose:** Track async job status.
- **Fields:** `job_id`, `status`, `progress?`, `result? (GenerateResponse)`, `error?`, `created_at`, `updated_at`.

### `loras/*/brand_metadata.json`
- **Purpose:** Saved brand DNA used for LoRA training/metadata.
- **Fields:** `brand_id`, `original_brand_id`, `brand_name`, `tagline`, `brand_values[]`, `target_audience[]`, `tone_of_voice[]`, `colors[]`, `accent_color`, `fonts[]`, `main_font`, `business_overview`, `logo`, `images[]`, `saved_at` (ISO).


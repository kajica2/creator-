# Recruiter Agents & Opportunity Flow

## Overview

The recruiter agent extends the Agent Orchestrator with growth-focused workflows that can create opportunities, invite prospects, and surface analytics to the UI.

- Agent type: `recruiter`
- Pipeline: `recruiter-opportunity`
- Entry points:
  - `RecruiterAgent` via orchestrator messages
  - REST endpoint `GET /api/recruiter` for analytics
  - Supabase RPC `track_hashtag_usage` reused for tagging invites

## Database Entities

| Table | Purpose |
|-------|---------|
| `recruiter_opportunities` | High-level opportunity records with handles, priority, and telemetry |
| `recruiter_invites` | Email/user invitations tied to opportunities |
| `recruiter_activity_log` | Timeline of agent-driven events (opportunity creation, invite sent, status change) |
| `recruiter_dashboard_stats` (view) | Aggregated overview with invite rollups |

### Schema Highlights

```sql
select * from recruiter_opportunities limit 5;
select * from recruiter_dashboard_stats where recruiter_id = '<uuid>';
```

- Handles are stored to support demo environments where auth users are optional.
- Views summarise active opportunities, accepted invites, and captured tags.
- Activity log is used by the UI to render recruiter analytics.

## RecruiterAgent Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `createOpportunity` | `{ title, tags, priority }` | Inserts into `recruiter_opportunities` and logs activity |
| `inviteCandidates` | `{ invites: [{ opportunityId, inviteeEmail }] }` | Inserts into `recruiter_invites` and records activity |
| `updateOpportunityStatus` | `{ opportunityId, status }` | Moves opportunities through `draft → active → filled/closed` |
| `getAnalytics` | `{ recruiterId }` | Returns rollups from `recruiter_dashboard_stats` + recent invites |

## REST Analytics Endpoint

`GET /api/recruiter?recruiterId=<uuid>` returns:

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_opportunities": 12,
      "active_opportunities": 4,
      "accepted_invites": 18
    },
    "recentOpportunities": [...],
    "recentInvites": [...],
    "inviteStats": {
      "total": 25,
      "byStatus": { "pending": 7, "accepted": 12, "declined": 6 }
    }
  }
}
```

## UI Integration Points

- `HashtagManager` and future recruiter dashboards can call the REST endpoint for analytics.
- `BashingArena` can reuse recruiter invites to seed duel participants.
- `UserProfileCard` + `Sidebar` are now rating-aware, connected to Supabase `user_ratings`.

## Operational Checklist

1. Run migrations `007_create_recruiter_tables.sql` and `010_create_user_ratings.sql`
2. Deploy `/api/recruiter` for analytics and `/api/userRatings` for community feedback
3. Register recruiter agent: the orchestrator now instantiates it automatically
4. (Optional) Seed opportunities using the slice below

```sql
insert into recruiter_opportunities (challenger_handle, challenged_handle, stake_tags, status)
values ('@growth-labs', '@creator-one', array['ai marketing', 'storytelling'], 'active');
```


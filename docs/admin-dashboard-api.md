# Admin dashboard API

## `GET /admin/dashboard`

Returns an administrative overview and the ten most recent audit events. The response is marked `Cache-Control: no-store`.

Authentication requires a valid access token in the `Authorization: Bearer <token>` header and an account whose primary role is `ADMIN`. Missing or invalid sessions receive `401`; authenticated non-admin users receive `403`.

The response contains:

- `users`: non-deleted user total, totals by primary role, and suspended users.
- `jobs`: total listings, published listings, and listings awaiting review.
- `employerVerifications`: pending, under-review, and needs-more-information counts.
- `reports`: open and under-review counts.
- `recentActivity`: the newest audit events, including action, entity, timestamp, and optional actor.

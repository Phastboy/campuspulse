# Tag Suite — Admin Management & Public Browse

# ---------------------------------------------------------------------------
# Admin-only tag management (requires ADMIN/MODERATOR platform role)
# ---------------------------------------------------------------------------
# NOTE: These tests require HURL_admin_token to be set.

# --- Create a tag ---
POST {{api_url}}/api/tags
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "name": "Luxury Vehicle {{run_id}}"
}
HTTP 201
[Captures]
tag_id: jsonpath "$.id"
tag_slug: jsonpath "$.slug"
[Asserts]
jsonpath "$.id" isString
jsonpath "$.name" == "luxury vehicle {{run_id}}"
jsonpath "$.slug" isString

# --- Duplicate tag is rejected ---
POST {{api_url}}/api/tags
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "name": "Luxury Vehicle {{run_id}}"
}
HTTP *
[Asserts]
status toString matches "^(400|409)$"

# --- Non-admin cannot create tag ---
POST {{api_url}}/api/tags
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Unauthorized Tag {{run_id}}"
}
HTTP 403

# --- Unauthenticated cannot create ---
POST {{api_url}}/api/tags
Content-Type: application/json
{
  "name": "Ghost Tag {{run_id}}"
}
HTTP 401

# --- Get single tag by ID ---
GET {{api_url}}/api/tags/{{tag_id}}
HTTP 200
[Asserts]
jsonpath "$.id" == "{{tag_id}}"

# --- Update tag name ---
PUT {{api_url}}/api/tags/{{tag_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "name": "Super Luxury {{run_id}}"
}
HTTP 200
[Asserts]
jsonpath "$.name" == "super luxury {{run_id}}"

# ---------------------------------------------------------------------------
# Public tag browse (no auth required)
# ---------------------------------------------------------------------------

# --- Public list shows tags ---
GET {{api_url}}/api/tags
HTTP 200
[Asserts]
jsonpath "$.items" isCollection

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

# --- Delete tag ---
DELETE {{api_url}}/api/tags/{{tag_id}}
Authorization: Bearer {{admin_token}}
HTTP 204

# Review Suite — Full Lifecycle
# Covers: create, one-per-user constraint, update, media upload, delete

# --- Setup: create a public business to review ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Review Suite Business {{run_id}}",
  "description": "A business accepting reviews."
}
HTTP 201
[Captures]
review_biz_id: jsonpath "$.id"

PATCH {{api_url}}/api/businesses/{{review_biz_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "isPublic": true }
HTTP 200

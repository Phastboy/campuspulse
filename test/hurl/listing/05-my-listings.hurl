# Listing Owner View (authenticated, includes drafts)

# --- Create two listings (one draft, one published) ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "title": "My Draft Listing {{run_id}}" }
HTTP 201
[Captures]
mine_draft_id: jsonpath "$.id"

POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "title": "My Published Listing {{run_id}}" }
HTTP 201
[Captures]
mine_pub_id: jsonpath "$.id"

PATCH {{api_url}}/api/listings/{{mine_pub_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "status": "PUBLISHED" }
HTTP 200

# --- Owner sees all their listings (including drafts) ---
GET {{api_url}}/api/businesses/{{biz_id}}/listings/mine
Authorization: Bearer {{owner_token}}
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$" count >= 2

# --- Unauthenticated cannot access owner-only list ---
GET {{api_url}}/api/businesses/{{biz_id}}/listings/mine
HTTP 401

# --- Cleanup ---
DELETE {{api_url}}/api/listings/{{mine_draft_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

DELETE {{api_url}}/api/listings/{{mine_pub_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

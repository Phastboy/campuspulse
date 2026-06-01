# Listing Suite — Full Lifecycle
# Covers: create, update, status transitions, discovery, media, delete

# --- Setup: create a business to own the listings ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Listing Suite Business {{run_id}}"
}
HTTP 201
[Captures]
biz_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" isString

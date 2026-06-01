# Listing Status Transitions (state machine enforcement)
# Valid transitions: DRAFT → PUBLISHED → PAUSED → PUBLISHED → ARCHIVED

# --- DRAFT → PUBLISHED ---
PATCH {{api_url}}/api/listings/{{listing_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "status": "PUBLISHED"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "PUBLISHED"

# --- PUBLISHED → PAUSED ---
PATCH {{api_url}}/api/listings/{{listing_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "status": "PAUSED"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "PAUSED"

# --- PAUSED → PUBLISHED (resume) ---
PATCH {{api_url}}/api/listings/{{listing_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "status": "PUBLISHED"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "PUBLISHED"

# --- PUBLISHED → ARCHIVED ---
PATCH {{api_url}}/api/listings/{{listing_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "status": "ARCHIVED"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "ARCHIVED"

# --- Invalid status value ---
PATCH {{api_url}}/api/listings/{{listing_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "status": "DELETED"
}
HTTP 400

# --- Intruder cannot transition ---
PATCH {{api_url}}/api/listings/{{listing_id}}/status
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "status": "PUBLISHED"
}
HTTP 403

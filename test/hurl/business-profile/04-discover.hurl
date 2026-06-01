# Public Discovery, Pagination and Visibility Engine Checks

# --- Create and publish a known business for slug lookup ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Discovery Test Shop {{run_id}}",
  "description": "A shop for discovery testing.",
  "location": "Port Harcourt, Nigeria"
}
HTTP 201
[Captures]
business_id: jsonpath "$.id"
business_slug: jsonpath "$.slug"

# --- Publish it ---
PATCH {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "isPublic": true }
HTTP 200

# --- Discover all public businesses (no auth required) ---
GET {{api_url}}/api/businesses
HTTP 200
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.total" isInteger
jsonpath "$.page" == 1
jsonpath "$.limit" isInteger

# --- Search by name ---
GET {{api_url}}/api/businesses?search=Discovery
HTTP 200
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.items" count >= 1
jsonpath "$.items[0].name" contains "Discovery"

# --- Pagination limit verification ---
GET {{api_url}}/api/businesses?page=1&limit=5
HTTP 200
[Asserts]
jsonpath "$.page" == 1
jsonpath "$.limit" == 5
jsonpath "$.items" count <= 5

# --- Get public storefront by slug (no auth) ---
GET {{api_url}}/api/businesses/{{business_slug}}
HTTP 200
[Asserts]
jsonpath "$.slug" == "{{business_slug}}"
jsonpath "$.isPublic" == true
jsonpath "$.name" == "Discovery Test Shop {{run_id}}"

# --- Private profile returns 404/403 for unauthenticated lookup ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Private Biz {{run_id}}"
}
HTTP 201
[Captures]
private_id: jsonpath "$.id"
private_slug: jsonpath "$.slug"

GET {{api_url}}/api/businesses/{{private_slug}}
HTTP *
[Asserts]
status toString matches "^(403|404)$"

# --- Non-existent slug returns 404 ---
GET {{api_url}}/api/businesses/this-slug-does-not-exist-xyz
HTTP 404

# --- Cleanup: remove private test business ---
DELETE {{api_url}}/api/businesses/{{private_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

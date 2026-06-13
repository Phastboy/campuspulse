# Listing Public Discovery

# --- Publish a fresh listing for discovery ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "title": "Discoverable Item {{run_id}}",
  "description": "Find me in search.",
  "price": {
    "minPrice": 1000,
    "maxPrice": 5000,
    "currencyCode": "NGN",
    "isNegotiable": false
  }
}
HTTP 201
[Captures]
disc_listing_id: jsonpath "$.id"
disc_listing_slug: jsonpath "$.slug"

PATCH {{api_url}}/api/listings/{{disc_listing_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "status": "PUBLISHED" }
HTTP 200

# --- Global discovery (public, no auth) ---
GET {{api_url}}/api/listings
HTTP 200
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.total" isInteger
jsonpath "$.page" == 1
jsonpath "$.limit" isInteger

# --- Filter by negotiable ---
GET {{api_url}}/api/listings?isNegotiable=false
HTTP 200
[Asserts]
jsonpath "$.items" isCollection

# --- Search by title keyword ---
GET {{api_url}}/api/listings?search=Discoverable
HTTP 200
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.items" count >= 1

# --- Business-scoped discovery ---
GET {{api_url}}/api/businesses/{{biz_id}}/listings
HTTP 200
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.items" count >= 1

# --- Get public listing by slug ---
GET {{api_url}}/api/listings/{{disc_listing_slug}}
HTTP 200
[Asserts]
jsonpath "$.slug" == "{{disc_listing_slug}}"
jsonpath "$.title" == "Discoverable Item {{run_id}}"
jsonpath "$.status" == "PUBLISHED"

# --- Non-existent slug returns 404 ---
GET {{api_url}}/api/listings/listing-that-does-not-exist-xyz
HTTP 404

# --- Pagination ---
GET {{api_url}}/api/listings?page=1&limit=3
HTTP 200
[Asserts]
jsonpath "$.page" == 1
jsonpath "$.limit" == 3
jsonpath "$.items" count <= 3

# --- Cleanup ---
DELETE {{api_url}}/api/listings/{{disc_listing_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

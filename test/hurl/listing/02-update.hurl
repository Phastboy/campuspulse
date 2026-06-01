# Listing Update & Ownership Enforcement

# --- Update title and description ---
PATCH {{api_url}}/api/listings/{{listing_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "title": "Updated Package Title {{run_id}}",
  "description": "Now with a description."
}
HTTP 200
[Asserts]
jsonpath "$.title" == "Updated Package Title {{run_id}}"
jsonpath "$.description" == "Now with a description."
jsonpath "$.status" == "DRAFT"

# --- Update price ---
PATCH {{api_url}}/api/listings/{{listing_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "price": {
    "minPrice": 2000,
    "maxPrice": 8000,
    "currency": "NGN",
    "isNegotiable": true
  }
}
HTTP 200
[Asserts]
jsonpath "$.minPrice" == "2000"
jsonpath "$.currency" == "NGN"
jsonpath "$.isNegotiable" == true

# --- Intruder cannot update ---
PATCH {{api_url}}/api/listings/{{listing_id}}
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "title": "Stolen Title"
}
HTTP 403

# --- Unauthenticated cannot update ---
PATCH {{api_url}}/api/listings/{{listing_id}}
Content-Type: application/json
{
  "title": "Ghost update"
}
HTTP 401

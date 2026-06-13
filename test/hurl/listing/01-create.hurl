# Listing Creation & Validation

# --- Create a listing (minimal) ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "title": "Premium Logistics Package {{run_id}}"
}
HTTP 201
[Captures]
listing_id: jsonpath "$.id"
listing_slug: jsonpath "$.slug"
[Asserts]
jsonpath "$.id" isString
jsonpath "$.businessProfileId" == "{{biz_id}}"
jsonpath "$.title" == "Premium Logistics Package {{run_id}}"
jsonpath "$.slug" isString
jsonpath "$.status" == "DRAFT"
jsonpath "$.isNegotiable" == false
jsonpath "$.minPrice" == null
jsonpath "$.maxPrice" == null
jsonpath "$.currencyCode" == null

# --- Create a listing with price ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "title": "Priced Listing {{run_id}}",
  "description": "A listing with a price range.",
  "price": {
    "minPrice": 5000,
    "maxPrice": 15000,
    "currencyCode": "NGN",
    "isNegotiable": true
  }
}
HTTP 201
[Captures]
priced_listing_id: jsonpath "$.id"
[Asserts]
jsonpath "$.minPrice" == "5000"
jsonpath "$.maxPrice" == "15000"
jsonpath "$.currencyCode" == "NGN"
jsonpath "$.isNegotiable" == true

# --- Reject listing with price but missing currency ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "title": "Bad Price Listing {{run_id}}",
  "price": {
    "minPrice": 1000,
    "isNegotiable": false
  }
}
HTTP 400

# --- Reject missing title ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "description": "No title provided"
}
HTTP 400

# --- Unauthenticated cannot create ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Content-Type: application/json
{
  "title": "Ghost Listing {{run_id}}"
}
HTTP 401

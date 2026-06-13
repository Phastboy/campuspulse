# Review Suite — Full Lifecycle
# Covers: create, one-per-user constraint, update, media upload, delete

# --- Setup: create a public business to own the listing ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Review Suite Business {{run_id}}",
  "description": "A business accepting reviews.",
  "businessType": "PHYSICAL",
  "phoneNumber": "+2348000000000",
  "whatsapp": "+2348000000000",
  "email": "test@business.com"
}
HTTP 201
[Captures]
review_biz_id: jsonpath "$.id"

PATCH {{api_url}}/api/businesses/{{review_biz_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "isPublic": true }
HTTP 200

# --- Setup: create a public listing to review ---
POST {{api_url}}/api/businesses/{{review_biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "title": "Listing for Reviews {{run_id}}"
}
HTTP 201
[Captures]
review_listing_id: jsonpath "$.id"

PATCH {{api_url}}/api/listings/{{review_listing_id}}/status
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "status": "PUBLISHED" }
HTTP 200

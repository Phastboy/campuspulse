# Listing Delete — Safety Guards

# --- Create listing to delete ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "title": "To Delete Listing {{run_id}}" }
HTTP 201
[Captures]
del_listing_id: jsonpath "$.id"

# --- Intruder cannot delete ---
DELETE {{api_url}}/api/listings/{{del_listing_id}}
Authorization: Bearer {{intruder_token}}
HTTP 403

# --- Unauthenticated cannot delete ---
DELETE {{api_url}}/api/listings/{{del_listing_id}}
HTTP 401

# --- Owner deletes ---
DELETE {{api_url}}/api/listings/{{del_listing_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

# --- Already deleted returns 404 ---
DELETE {{api_url}}/api/listings/{{del_listing_id}}
Authorization: Bearer {{owner_token}}
HTTP 404

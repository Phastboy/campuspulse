# Listing Media — Cover & Gallery Upload

# --- Create a fresh listing for media tests ---
POST {{api_url}}/api/businesses/{{biz_id}}/listings
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{ "title": "Media Test Listing {{run_id}}" }
HTTP 201
[Captures]
media_listing_id: jsonpath "$.id"

# --- Upload cover image (singleton) ---
POST {{api_url}}/api/listings/{{media_listing_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: COVER
HTTP 200
[Captures]
cover_id: jsonpath "$.id"
[Asserts]
jsonpath "$.role" == "COVER"
jsonpath "$.order" == null
jsonpath "$.url" isString

# --- Upload gallery image ---
POST {{api_url}}/api/listings/{{media_listing_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000106287.jpg; image/jpeg
role: GALLERY
HTTP 200
[Captures]
gallery_1_id: jsonpath "$.id"
[Asserts]
jsonpath "$.role" == "GALLERY"
jsonpath "$.order" == 0

# --- Upload second gallery image ---
POST {{api_url}}/api/listings/{{media_listing_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: GALLERY
HTTP 200
[Captures]
gallery_2_id: jsonpath "$.id"
[Asserts]
jsonpath "$.order" == 1

# --- Fetch grouped media ---
GET {{api_url}}/api/listings/{{media_listing_id}}/media
HTTP 200
[Asserts]
jsonpath "$.cover" isString
jsonpath "$.gallery" isCollection
jsonpath "$.gallery" count == 2

# --- Reorder gallery ---
PATCH {{api_url}}/api/listings/{{media_listing_id}}/media/reorder
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "orderedIds": ["{{gallery_2_id}}", "{{gallery_1_id}}"]
}
HTTP 200
[Asserts]
jsonpath "$[0].id" == "{{gallery_2_id}}"
jsonpath "$[0].order" == 0
jsonpath "$[1].id" == "{{gallery_1_id}}"
jsonpath "$[1].order" == 1

# --- Intruder cannot upload ---
POST {{api_url}}/api/listings/{{media_listing_id}}/media
Authorization: Bearer {{intruder_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: COVER
HTTP 403

# --- LOGO role is invalid for listings ---
POST {{api_url}}/api/listings/{{media_listing_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: LOGO
HTTP 400

# --- Delete gallery item ---
DELETE {{api_url}}/api/media/{{gallery_1_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

# --- Order should renormalize after deletion ---
GET {{api_url}}/api/listings/{{media_listing_id}}/media
HTTP 200
[Asserts]
jsonpath "$.gallery" count == 1
jsonpath "$.gallery[0].order" == 0

# --- Cleanup listing ---
DELETE {{api_url}}/api/listings/{{media_listing_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

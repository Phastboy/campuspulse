# Business Profile Media Upload — Logo, Banner, Gallery
# Branding is now managed via the polymorphic media system, not dedicated /logo /banner endpoints.

# --- Create a business to brand ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Branding Test Biz {{run_id}}"
}
HTTP 201
[Captures]
business_id: jsonpath "$.id"

# --- Upload logo (role=LOGO, singleton) ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: LOGO
HTTP 200
[Captures]
logo_media_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" isString
jsonpath "$.url" isString
jsonpath "$.mediaType" == "IMAGE"
jsonpath "$.role" == "LOGO"
jsonpath "$.order" == null

# --- Upload banner (role=BANNER, singleton) ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000106287.jpg; image/jpeg
role: BANNER
HTTP 200
[Captures]
banner_media_id: jsonpath "$.id"
[Asserts]
jsonpath "$.role" == "BANNER"
jsonpath "$.order" == null

# --- Replace logo — uploading again replaces the singleton ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000106287.jpg; image/jpeg
role: LOGO
HTTP 200
[Captures]
new_logo_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" != "{{logo_media_id}}"

# --- Upload a gallery image ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: GALLERY
HTTP 200
[Captures]
gallery_item_id: jsonpath "$.id"
[Asserts]
jsonpath "$.role" == "GALLERY"
jsonpath "$.order" isInteger

# --- Fetch grouped media (logo/banner/gallery) ---
GET {{api_url}}/api/business-profiles/{{business_id}}/media
HTTP 200
[Asserts]
jsonpath "$.logo" isString       # logo.url present
jsonpath "$.banner" isString     # banner.url present
jsonpath "$.gallery" isCollection
jsonpath "$.gallery" count >= 1

# --- Intruder cannot upload ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
Authorization: Bearer {{intruder_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: LOGO
HTTP 403

# --- Unauthenticated cannot upload ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: LOGO
HTTP 401

# --- No file uploaded returns 400 ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{}
HTTP 400

# --- COVER role is not valid for business profiles ---
POST {{api_url}}/api/business-profiles/{{business_id}}/media
Authorization: Bearer {{owner_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: COVER
HTTP 400

# --- Delete a media item ---
DELETE {{api_url}}/api/media/{{gallery_item_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

# --- Intruder cannot delete media ---
DELETE {{api_url}}/api/media/{{new_logo_id}}
Authorization: Bearer {{intruder_token}}
HTTP 403

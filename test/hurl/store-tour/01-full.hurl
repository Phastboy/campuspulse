# Store Tour Suite — Creation, Publishing, Validation, and Media
# ---------------------------------------------------------------------------
# Requires HURL_admin_token (Moderator or Admin role required)
# ---------------------------------------------------------------------------

# --- Non-admin cannot create store tour ---
POST {{api_url}}/api/business-profiles/{{tour_biz_id}}/store-tours
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "title": "Unauthorized Tour {{run_id}}",
  "visitDate": "2026-06-09T10:00:00Z"
}
HTTP 403

# --- Create a store tour (Admin) ---
POST {{api_url}}/api/business-profiles/{{tour_biz_id}}/store-tours
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "title": "Awesome Store Tour {{run_id}}",
  "summary": "This is an amazing store.",
  "visitDate": "2026-06-09T10:00:00Z",
  "highlights": ["Friendly staff", "Great location"]
}
HTTP 201
[Captures]
tour_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" isString
jsonpath "$.status" == "DRAFT"
jsonpath "$.highlights" count == 2

# --- Publish without media is rejected ---
PATCH {{api_url}}/api/store-tours/{{tour_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "status": "PUBLISHED"
}
HTTP 400
[Asserts]
jsonpath "$.message" contains "media"

# --- Upload media to store tour ---
POST {{api_url}}/api/store-tours/{{tour_id}}/media
Authorization: Bearer {{admin_token}}
[Multipart]
file: file,/home/tgenericx/Pictures/sharp.png; image/png
role: GALLERY
HTTP 201
[Captures]
tour_photo_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" isString

# --- Publish with media succeeds ---
PATCH {{api_url}}/api/store-tours/{{tour_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "status": "PUBLISHED"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "PUBLISHED"
jsonpath "$.publishedAt" isString

# --- Update highlights ---
PATCH {{api_url}}/api/store-tours/{{tour_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "highlights": ["Superb interior"]
}
HTTP 200
[Asserts]
jsonpath "$.highlights" count == 1
jsonpath "$.highlights[0].value" == "Superb interior"

# --- Public discover shows published tours ---
GET {{api_url}}/api/business-profiles/{{tour_biz_id}}/store-tours
HTTP 200
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.items[0].media" isCollection

# --- Delete store tour ---
DELETE {{api_url}}/api/store-tours/{{tour_id}}
Authorization: Bearer {{admin_token}}
HTTP 204

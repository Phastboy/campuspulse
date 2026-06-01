# Review Media — Raw Photo Upload (GALLERY only, max 8)

# --- Upload a photo to the reviewer's review ---
POST {{api_url}}/api/reviews/{{review_id}}/media
Authorization: Bearer {{reviewer_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: GALLERY
HTTP 200
[Captures]
review_photo_1_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" isString
jsonpath "$.role" == "GALLERY"
jsonpath "$.order" == 0
jsonpath "$.url" isString
jsonpath "$.mediaType" == "IMAGE"

# --- Upload a second photo ---
POST {{api_url}}/api/reviews/{{review_id}}/media
Authorization: Bearer {{reviewer_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000106287.jpg; image/jpeg
role: GALLERY
HTTP 200
[Captures]
review_photo_2_id: jsonpath "$.id"
[Asserts]
jsonpath "$.order" == 1

# --- Fetch review media (gallery only — no logo/banner/cover) ---
GET {{api_url}}/api/reviews/{{review_id}}/media
HTTP 200
[Asserts]
jsonpath "$.gallery" isCollection
jsonpath "$.gallery" count == 2
jsonpath "$.gallery[0].order" == 0
jsonpath "$.gallery[1].order" == 1

# --- Reviews do NOT support COVER role (enforced at domain layer) ---
POST {{api_url}}/api/reviews/{{review_id}}/media
Authorization: Bearer {{reviewer_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: COVER
HTTP 400

# --- Reviews do NOT support LOGO role ---
POST {{api_url}}/api/reviews/{{review_id}}/media
Authorization: Bearer {{reviewer_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: LOGO
HTTP 400

# --- Intruder cannot upload to someone else's review ---
POST {{api_url}}/api/reviews/{{review_id}}/media
Authorization: Bearer {{intruder_token}}
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: GALLERY
HTTP 403

# --- Unauthenticated cannot upload ---
POST {{api_url}}/api/reviews/{{review_id}}/media
[Multipart]
file: file,{{fixtures_dir}}/1000058559.jpg; image/jpeg
role: GALLERY
HTTP 401

# --- Reorder review photos ---
PATCH {{api_url}}/api/reviews/{{review_id}}/media/reorder
Authorization: Bearer {{reviewer_token}}
Content-Type: application/json
{
  "orderedIds": ["{{review_photo_2_id}}", "{{review_photo_1_id}}"]
}
HTTP 200
[Asserts]
jsonpath "$[0].id" == "{{review_photo_2_id}}"
jsonpath "$[0].order" == 0

# --- Intruder cannot reorder ---
PATCH {{api_url}}/api/reviews/{{review_id}}/media/reorder
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "orderedIds": ["{{review_photo_1_id}}", "{{review_photo_2_id}}"]
}
HTTP 403

# --- Delete a photo ---
DELETE {{api_url}}/api/media/{{review_photo_1_id}}
Authorization: Bearer {{reviewer_token}}
HTTP 204

# --- Order renormalizes after deletion ---
GET {{api_url}}/api/reviews/{{review_id}}/media
HTTP 200
[Asserts]
jsonpath "$.gallery" count == 1
jsonpath "$.gallery[0].order" == 0

# --- Review list now shows embedded media ---
GET {{api_url}}/api/business-profiles/{{review_biz_id}}/reviews
HTTP 200
[Asserts]
jsonpath "$.items[0].media" isCollection
jsonpath "$.items[0].media" count >= 1

# Review Delete — Safety Guards & Cascade

# --- Intruder cannot delete reviewer's review ---
DELETE {{api_url}}/api/reviews/{{review_id}}
Authorization: Bearer {{intruder_token}}
HTTP 403

# --- Unauthenticated cannot delete ---
DELETE {{api_url}}/api/reviews/{{review_id}}
HTTP 401

# --- Reviewer deletes their own review (cascades media) ---
DELETE {{api_url}}/api/reviews/{{review_id}}
Authorization: Bearer {{reviewer_token}}
HTTP 204

# --- Review is gone from public listing ---
GET {{api_url}}/api/listings/{{review_listing_id}}/reviews
HTTP 200
[Asserts]
jsonpath "$.items" count == 0

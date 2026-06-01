# Review Update & Ownership Enforcement

# --- Reviewer updates their own review ---
PATCH {{api_url}}/api/reviews/{{review_id}}
Authorization: Bearer {{reviewer_token}}
Content-Type: application/json
{
  "rating": 5,
  "comment": "Actually, even better than I thought!"
}
HTTP 200
[Asserts]
jsonpath "$.id" == "{{review_id}}"
jsonpath "$.rating" == 5
jsonpath "$.comment" == "Actually, even better than I thought!"

# --- Partial update (rating only) ---
PATCH {{api_url}}/api/reviews/{{review_id}}
Authorization: Bearer {{reviewer_token}}
Content-Type: application/json
{
  "rating": 3
}
HTTP 200
[Asserts]
jsonpath "$.rating" == 3
jsonpath "$.comment" == "Actually, even better than I thought!"

# --- Clear comment (set to null) ---
PATCH {{api_url}}/api/reviews/{{review_id}}
Authorization: Bearer {{reviewer_token}}
Content-Type: application/json
{
  "comment": null
}
HTTP 200
[Asserts]
jsonpath "$.comment" == null

# --- Intruder cannot update someone else's review ---
PATCH {{api_url}}/api/reviews/{{review_id}}
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "rating": 1,
  "comment": "I'm trying to sabotage this review!"
}
HTTP 403

# --- Unauthenticated cannot update ---
PATCH {{api_url}}/api/reviews/{{review_id}}
Content-Type: application/json
{
  "rating": 1
}
HTTP 401

# --- Invalid rating value still rejected on update ---
PATCH {{api_url}}/api/reviews/{{review_id}}
Authorization: Bearer {{reviewer_token}}
Content-Type: application/json
{
  "rating": 10
}
HTTP 400

# Review Creation & Validation

# --- Submit a review (reviewer) ---
POST {{api_url}}/api/business-profiles/{{review_biz_id}}/reviews
Authorization: Bearer {{reviewer_token}}
Content-Type: application/json
{
  "rating": 4,
  "comment": "Great service, fast delivery!"
}
HTTP 201
[Captures]
review_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" isString
jsonpath "$.businessProfileId" == "{{review_biz_id}}"
jsonpath "$.rating" == 4
jsonpath "$.comment" == "Great service, fast delivery!"
jsonpath "$.createdAt" isString
jsonpath "$.updatedAt" isString

# --- Duplicate review for same business must fail (409) ---
POST {{api_url}}/api/business-profiles/{{review_biz_id}}/reviews
Authorization: Bearer {{reviewer_token}}
Content-Type: application/json
{
  "rating": 5,
  "comment": "Trying to submit again."
}
HTTP 409

# --- Rating below 1 is rejected ---
POST {{api_url}}/api/business-profiles/{{review_biz_id}}/reviews
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "rating": 0,
  "comment": "Zero stars"
}
HTTP 400

# --- Rating above 5 is rejected ---
POST {{api_url}}/api/business-profiles/{{review_biz_id}}/reviews
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "rating": 6
}
HTTP 400

# --- Non-integer rating is rejected ---
POST {{api_url}}/api/business-profiles/{{review_biz_id}}/reviews
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "rating": 3.5
}
HTTP 400

# --- Unauthenticated cannot submit review ---
POST {{api_url}}/api/business-profiles/{{review_biz_id}}/reviews
Content-Type: application/json
{
  "rating": 3
}
HTTP 401

# --- Non-existent business returns 404 ---
POST {{api_url}}/api/business-profiles/does-not-exist-xyz/reviews
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "rating": 3
}
HTTP 404

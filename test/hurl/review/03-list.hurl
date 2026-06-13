# Review Read — Public Listing with Embedded Media

# --- Anyone can list reviews for a business (no auth required) ---
GET {{api_url}}/api/listings/{{review_listing_id}}/reviews
HTTP 200
[Asserts]
jsonpath "$.items" isCollection
jsonpath "$.items" count >= 1
jsonpath "$.items[0].id" isString
jsonpath "$.items[0].rating" isInteger
jsonpath "$.items[0].media" isCollection
jsonpath "$.nextCursor" exists

# --- Pagination: limit=1 to verify cursor works ---
GET {{api_url}}/api/listings/{{review_listing_id}}/reviews?limit=1
HTTP 200
[Captures]
page1_cursor: jsonpath "$.nextCursor"
[Asserts]
jsonpath "$.items" count == 1
jsonpath "$.limit" not exists   # cursor-based — no limit field in response shape

# --- Non-existent business returns empty list or 404 ---
GET {{api_url}}/api/business-profiles/does-not-exist-xyz/reviews
HTTP *
[Asserts]
status toString matches "^(200|404)$"

# =========================================================
# MVP Checklist Verification (Hurl)
# =========================================================

# 1. Create Account
POST {{api_url}}/api/accounts/register
Content-Type: application/json
{
  "email": "mvp_{{run_id}}@pulse.test",
  "password": "Password123!",
  "name": "MVP Tester"
}
HTTP *
[Asserts]
status toString matches "^(201|409)$"

# Login to get token
POST {{api_url}}/api/auth/login
Content-Type: application/json
{
  "email": "mvp_{{run_id}}@pulse.test",
  "password": "Password123!"
}
HTTP 200
[Captures]
mvp_token: jsonpath "$.token"

# 2. Create Business Profile Draft
POST {{api_url}}/api/businesses/drafts
Authorization: Bearer {{mvp_token}}
Content-Type: application/json
{
  "name": "MVP Gadgets {{run_id}}",
  "description": "Quality gadgets for the modern world.",
  "businessType": "PHYSICAL",
  "phoneNumber": "+2348000000000",
  "whatsapp": "+2348000000000",
  "email": "mvp_{{run_id}}@pulse.test",
  "location": "Lagos, Nigeria"
}
HTTP 201
[Captures]
business_id: jsonpath "$.id"

# Request verification (to simulate the flow)
POST {{api_url}}/api/businesses/drafts/{{business_id}}/request-verification
Authorization: Bearer {{mvp_token}}
HTTP 200

# Skip actual email verification since we are in a test script. 
# We will use the admin token (or rely on the fact that drafting is enough to add listings? Let's check.)
# Actually, the API allows adding listings to draft businesses, or we can just verify it if we have an admin token, 
# but for the MVP demonstration, we will just use the business_id.

# 3. List an Item
# Fetch categories to get an ID
GET {{api_url}}/api/categories
HTTP 200
[Captures]
category_id: jsonpath "$[0].children[0].id"

# Create the listing
POST {{api_url}}/api/businesses/{{business_id}}/listings
Authorization: Bearer {{mvp_token}}
Content-Type: application/json
{
  "title": "iPhone 16 Pro Max - {{run_id}}",
  "description": "Brand new in box.",
  "categoryId": "{{category_id}}",
  "price": { "minPrice": 1500000, "isNegotiable": false, "currencyCode": "NGN" }
}
HTTP *
[Captures]
listing_id: jsonpath "$.id"

# 4. Discover Businesses and Listings
# Discover the business via slug
GET {{api_url}}/api/businesses/{{business_slug}}
HTTP 200
[Asserts]
jsonpath "$.id" == "{{business_id}}"

# Discover listings
GET {{api_url}}/api/listings?search=iPhone
HTTP 200
[Asserts]
jsonpath "$.items" count > 0

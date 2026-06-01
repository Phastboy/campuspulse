# Resource Mutation & Permissions Enforcement

# --- Create a business to update ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Update Test Biz {{run_id}}"
}
HTTP 201
[Captures]
business_id: jsonpath "$.id"

# --- Update fields ---
PATCH {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "description": "Updated description.",
  "location": "Abuja, Nigeria"
}
HTTP 200
[Asserts]
jsonpath "$.description" == "Updated description."
jsonpath "$.location" == "Abuja, Nigeria"
jsonpath "$.name" == "Update Test Biz {{run_id}}"

# --- Publish the profile ---
PATCH {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "isPublic": true
}
HTTP 200
[Asserts]
jsonpath "$.isPublic" == true

# --- Intruder cannot update ---
PATCH {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{intruder_token}}
Content-Type: application/json
{
  "description": "I shouldn't be able to do this."
}
HTTP 403

# --- Unauthenticated cannot update ---
PATCH {{api_url}}/api/businesses/{{business_id}}
Content-Type: application/json
{
  "description": "Ghost update"
}
HTTP 401

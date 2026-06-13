# Destructive Operation Safety Guards

# --- Create a business to delete ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "To Be Deleted Biz {{run_id}}",
  "businessType": "PHYSICAL",
  "phoneNumber": "+2348000000000",
  "whatsapp": "+2348000000000",
  "email": "test@business.com"
}
HTTP 201
[Captures]
business_id: jsonpath "$.id"

# --- Intruder cannot delete ---
DELETE {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{intruder_token}}
HTTP 403

# --- Unauthenticated cannot delete ---
DELETE {{api_url}}/api/businesses/{{business_id}}
HTTP 401

# --- Owner deletes successfully ---
DELETE {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{owner_token}}
HTTP 204

# --- Profile is gone ---
DELETE {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{owner_token}}
HTTP 404

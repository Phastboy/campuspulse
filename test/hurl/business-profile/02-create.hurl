# Business Profile Creation & Validation Boundary Tests

# --- Create a business profile (minimal required fields) ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Pulse Logistics Co {{run_id}}",
  "description": "End-to-end logistics solutions across Nigeria.",
  "phoneNumber": "+2348000000001",
  "whatsapp": "+2348000000001",
  "email": "contact@pulselogistics.test",
  "location": "Lagos, Nigeria",
  "businessType": "PHYSICAL"
}
HTTP 201
[Captures]
business_id: jsonpath "$.id"
business_slug: jsonpath "$.slug"
[Asserts]
jsonpath "$.id" matches "^c[a-z0-9]{23,32}$"
jsonpath "$.ownerId" isString
jsonpath "$.name" == "Pulse Logistics Co {{run_id}}"
jsonpath "$.slug" isString
jsonpath "$.verificationStatus" == "UNVERIFIED"
jsonpath "$.isPublic" == false
jsonpath "$.description" == "End-to-end logistics solutions across Nigeria."
jsonpath "$.email" == "contact@pulselogistics.test"
jsonpath "$.location" == "Lagos, Nigeria"

# --- MULTI-TENANT ISOLATION: Intruder must not view owner's private profile ---
GET {{api_url}}/api/businesses/{{business_id}}
Authorization: Bearer {{intruder_token}}
HTTP *
[Asserts]
status toString matches "^(403|404)$"

# --- Reject missing required fields (name is required) ---
POST {{api_url}}/api/businesses
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "description": "Missing name",
  "businessType": "PHYSICAL",
  "phoneNumber": "+2348000000000",
  "whatsapp": "+2348000000000",
  "email": "test@business.com"
}
HTTP 400

# --- Reject unauthenticated request ---
POST {{api_url}}/api/businesses
Content-Type: application/json
{
  "name": "Ghost Business {{run_id}}",
  "businessType": "PHYSICAL",
  "phoneNumber": "+2348000000000",
  "whatsapp": "+2348000000000",
  "email": "test@business.com"
}
HTTP 401

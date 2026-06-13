# Category Suite — Admin Management & Public Browse

# ---------------------------------------------------------------------------
# Admin-only category management (requires ADMIN platform role)
# ---------------------------------------------------------------------------
# NOTE: These tests require HURL_admin_token to be set.
# Admin role must be granted out-of-band (e.g. via seed or DB update).

# --- Create a root category ---
POST {{api_url}}/api/admin/categories
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "name": "Logistics {{run_id}}",
  "description": "All logistics and courier services."
}
HTTP 201
[Captures]
root_category_id: jsonpath "$.id"
root_category_slug: jsonpath "$.slug"
[Asserts]
jsonpath "$.id" isString
jsonpath "$.name" == "Logistics {{run_id}}"
jsonpath "$.slug" isString
jsonpath "$.parentId" == null
jsonpath "$.isActive" == true

# --- Create a leaf category under the root ---
POST {{api_url}}/api/admin/categories
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "name": "Express Courier {{run_id}}",
  "parentId": "{{root_category_id}}"
}
HTTP 201
[Captures]
leaf_category_id: jsonpath "$.id"
leaf_category_slug: jsonpath "$.slug"
[Asserts]
jsonpath "$.parentId" == "{{root_category_id}}"

# --- Duplicate slug is rejected ---
POST {{api_url}}/api/admin/categories
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "name": "Logistics {{run_id}}"
}
HTTP *
[Asserts]
status toString matches "^(400|409)$"

# --- Non-admin cannot create category ---
POST {{api_url}}/api/admin/categories
Authorization: Bearer {{owner_token}}
Content-Type: application/json
{
  "name": "Unauthorized Category {{run_id}}"
}
HTTP 403

# --- Unauthenticated cannot create ---
POST {{api_url}}/api/admin/categories
Content-Type: application/json
{
  "name": "Ghost Category {{run_id}}"
}
HTTP 401

# --- Admin sees all categories (including inactive) ---
GET {{api_url}}/api/admin/categories
Authorization: Bearer {{admin_token}}
HTTP 200
[Asserts]
jsonpath "$" isCollection

# --- Get single category by ID ---
GET {{api_url}}/api/admin/categories/{{root_category_id}}
Authorization: Bearer {{admin_token}}
HTTP 200
[Asserts]
jsonpath "$.id" == "{{root_category_id}}"

# --- Update category name ---
PATCH {{api_url}}/api/admin/categories/{{root_category_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json
{
  "description": "Updated description for logistics."
}
HTTP 200
[Asserts]
jsonpath "$.description" == "Updated description for logistics."

# --- Deactivate a category ---
POST {{api_url}}/api/admin/categories/{{leaf_category_id}}/deactivate
Authorization: Bearer {{admin_token}}
HTTP *
[Asserts]
status toString matches "^(200|201)$"
jsonpath "$.isActive" == false

# --- Re-activate the category ---
POST {{api_url}}/api/admin/categories/{{leaf_category_id}}/activate
Authorization: Bearer {{admin_token}}
HTTP *
[Asserts]
status toString matches "^(200|201)$"
jsonpath "$.isActive" == true

# ---------------------------------------------------------------------------
# Public category browse (no auth required)
# ---------------------------------------------------------------------------

# --- Public tree shows active categories only ---
GET {{api_url}}/api/categories
HTTP *
[Asserts]
status toString matches "^(200|201)$"
jsonpath "$" isCollection

# --- Public category by slug ---
GET {{api_url}}/api/categories/{{root_category_slug}}
HTTP *
[Asserts]
status toString matches "^(200|201)$"
jsonpath "$.slug" == "{{root_category_slug}}"
jsonpath "$.isActive" == true

# --- Non-existent slug returns 404 ---
GET {{api_url}}/api/categories/category-that-does-not-exist-xyz
HTTP 404

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

# --- Delete leaf first (no assignments) ---
DELETE {{api_url}}/api/admin/categories/{{leaf_category_id}}
Authorization: Bearer {{admin_token}}
HTTP *
[Asserts]
status toString matches "^(200|201)$"
jsonpath "$.deleted" == true

# --- Delete root (no children remaining) ---
DELETE {{api_url}}/api/admin/categories/{{root_category_id}}
Authorization: Bearer {{admin_token}}
HTTP *
[Asserts]
status toString matches "^(200|201)$"
jsonpath "$.deleted" == true

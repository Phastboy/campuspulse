#!/usr/bin/env bash
# =============================================================================
# run.sh — run all listing hurl tests in order
# =============================================================================

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="$DIR/reports"

export HURL_fixtures_dir="$DIR/../fixtures"

command -v hurl &>/dev/null || { echo "❌ hurl not installed. See https://hurl.dev"; exit 1; }
command -v jq   &>/dev/null || { echo "❌ jq not installed. See https://jqlang.org";  exit 1; }

if [[ -f "$DIR/../.env" ]]; then
    set -a; source "$DIR/../.env"; set +a
    echo "✅ Loaded variables from .env"
fi

: "${HURL_api_url:?Need to set HURL_api_url}"
: "${HURL_owner_email:?Need to set HURL_owner_email}"
: "${HURL_owner_password:?Need to set HURL_owner_password}"
: "${HURL_intruder_email:?Need to set HURL_intruder_email}"
: "${HURL_intruder_password:?Need to set HURL_intruder_password}"

rm -rf "$REPORTS_DIR"
mkdir -p "$REPORTS_DIR/html"

export HURL_run_id="${TEST_RUN_ID:-$(date +%s)}"

echo ""
echo "🌐 API URL: $HURL_api_url"
echo "🏷️  Run ID:  $HURL_run_id"
echo ""

REPORT_FLAGS=(
    --report-html  "$REPORTS_DIR/html"
    --report-junit "$REPORTS_DIR/junit.xml"
)

run_test() {
    local label=$1
    local file=$2
    echo ""
    echo "=== $label ==="
    hurl --test --color "${REPORT_FLAGS[@]}" "$file" || {
        echo "❌ $label failed"
        exit 1
    }
}

# Login to get tokens + capture biz_id from setup
echo "=== Login ==="
login_json=$(hurl --color "${REPORT_FLAGS[@]}" --variables-file "$DIR/../.env" --json - <<'EOF'
POST {{api_url}}/api/auth/login
Content-Type: application/json
{"email":"{{owner_email}}","password":"{{owner_password}}"}
HTTP 200
[Captures]
owner_token: jsonpath "$.token"
EOF
)

# Better: just source tokens from the shared env and let hurl use --variable
# Re-use the shared login approach (tokens exported as env vars by parent runner)
: "${HURL_owner_token:?Run test/hurl/run.sh from the root runner which sets tokens}"
: "${HURL_intruder_token:?Run test/hurl/run.sh from the root runner which sets tokens}"

run_test "00 Setup"       "$DIR/00-setup.hurl"
run_test "01 Create"      "$DIR/01-create.hurl"
run_test "02 Update"      "$DIR/02-update.hurl"
run_test "03 Status"      "$DIR/03-status.hurl"
run_test "04 Discover"    "$DIR/04-discover.hurl"
run_test "05 My Listings" "$DIR/05-my-listings.hurl"
run_test "06 Media"       "$DIR/06-media.hurl"
run_test "07 Delete"      "$DIR/07-delete.hurl"

echo ""
echo "✅ All listing tests passed."
echo "📊 Report: $REPORTS_DIR/html/index.html"

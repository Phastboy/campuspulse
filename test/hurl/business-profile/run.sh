#!/usr/bin/env bash
# =============================================================================
# run.sh — run all business-profile hurl tests in order
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
: "${HURL_reviewer_email:?Need to set HURL_reviewer_email}"
: "${HURL_reviewer_password:?Need to set HURL_reviewer_password}"
: "${HURL_intruder_email:?Need to set HURL_intruder_email}"
: "${HURL_intruder_password:?Need to set HURL_intruder_password}"

rm -rf "$REPORTS_DIR"
mkdir -p "$REPORTS_DIR/html"

export HURL_run_id="${TEST_RUN_ID:-$(date +%s)}"

echo ""
echo "🌐 API URL:       $HURL_api_url"
echo "🏷️  Run ID:        $HURL_run_id"
echo "📁 Fixtures Dir:   $HURL_fixtures_dir"
echo "📁 Reports:        $REPORTS_DIR"
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
        echo "❌ $label failed — opening report..."
        if [[ "${CI:-}" != "true" ]]; then
            if command -v open &>/dev/null; then open "$REPORTS_DIR/html/index.html";
            elif command -v xdg-open &>/dev/null; then xdg-open "$REPORTS_DIR/html/index.html"; fi
        fi
        exit 1
    }
}

# Setup
run_test "00 Setup" "$DIR/00-setup.hurl"

# Login — capture tokens via JSON output
echo ""
echo "=== 01 Login ==="
login_json=$(hurl --color "${REPORT_FLAGS[@]}" --json "$DIR/01-login.hurl")

extract_capture() {
    local name=$1
    echo "$login_json" \
        | jq -r --arg n "$name" '.entries[].captures[] | select(.name == $n) | .value' \
        | head -1
}

HURL_owner_token=$(extract_capture "owner_token")
HURL_reviewer_token=$(extract_capture "reviewer_token")
HURL_intruder_token=$(extract_capture "intruder_token")

[[ -z "$HURL_owner_token"    || "$HURL_owner_token"    == "null" ]] && { echo "❌ Failed to capture owner_token";    exit 1; }
[[ -z "$HURL_reviewer_token" || "$HURL_reviewer_token" == "null" ]] && { echo "❌ Failed to capture reviewer_token"; exit 1; }
[[ -z "$HURL_intruder_token" || "$HURL_intruder_token" == "null" ]] && { echo "❌ Failed to capture intruder_token"; exit 1; }

export HURL_owner_token HURL_reviewer_token HURL_intruder_token
echo "🔑 Tokens captured and exported"

run_test "02 Create"          "$DIR/02-create.hurl"
run_test "03 Update"          "$DIR/03-update.hurl"
run_test "04 Discover"        "$DIR/04-discover.hurl"
run_test "05 My Businesses"   "$DIR/05-my-businesses.hurl"
run_test "06 Delete"          "$DIR/06-delete.hurl"
run_test "07 Upload Branding" "$DIR/07-upload-branding.hurl"

echo ""
echo "✅ All business-profile tests passed."
echo "📊 Report: $REPORTS_DIR/html/index.html"

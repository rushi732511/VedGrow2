# ─── vedgrow  API Test Suite ──────────────────────────────────────────
# Run each section one at a time and verify the output matches expectations.
# BASE URL
$BASE = "http://localhost:4000/v1"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 1: PUBLIC ROUTES (No Auth)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 1.1 Health check
Write-Host "1.1 Health Check" -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:4000/health" | ConvertTo-Json
# Expected: { status: "ok" }

# 1.2 List all tracks
Write-Host "`n1.2 List All Tracks" -ForegroundColor Yellow
$tracks = Invoke-RestMethod -Uri "$BASE/tracks"
Write-Host "Total tracks: $($tracks.meta.total)"
# Expected: meta.total = 9

# 1.3 Get single track
Write-Host "`n1.3 Get Single Track" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BASE/tracks/web-development" | ConvertTo-Json -Depth 3
# Expected: track with name "Web Development" and curriculum array

# 1.4 Invalid track slug
Write-Host "`n1.4 Invalid Track (expect 404)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/tracks/does-not-exist"
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
# Expected: 404 NOT_FOUND

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 2: APPLICATION FLOW" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 2.1 Submit application
Write-Host "2.1 Submit Application" -ForegroundColor Yellow
$appBody = @{
    fullName = "Test Student"
    email = "teststudent@example.com"
    phone = "9876543210"
    trackSlug = "web-development"
} | ConvertTo-Json

$app = Invoke-RestMethod -Uri "$BASE/applications" -Method POST `
    -ContentType "application/json" -Body $appBody
$APP_ID = $app.data.applicationId
Write-Host "Application ID: $APP_ID" -ForegroundColor Green
# Expected: 201 with applicationId

# 2.2 Duplicate application (same email this month)
Write-Host "`n2.2 Duplicate Application (expect 409)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/applications" -Method POST `
        -ContentType "application/json" -Body $appBody
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
# Expected: 409 DUPLICATE_APPLICATION

# 2.3 Invalid email format
Write-Host "`n2.3 Invalid Email (expect 422)" -ForegroundColor Yellow
$badBody = @{
    fullName = "Test"
    email = "not-an-email"
    phone = "9876543210"
    trackSlug = "web-development"
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$BASE/applications" -Method POST `
        -ContentType "application/json" -Body $badBody
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
# Expected: 422 VALIDATION_ERROR

# 2.4 Create payment order
Write-Host "`n2.4 Create Payment Order" -ForegroundColor Yellow
$order = Invoke-RestMethod -Uri "$BASE/applications/$APP_ID/payment" -Method POST
Write-Host "Order ID: $($order.data.orderId)" -ForegroundColor Green
Write-Host "Amount: $($order.data.amount) paise"
# Expected: orderId starting with "order_mock_", amount: 12900

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 3: ADMIN AUTH" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 3.1 Login with wrong password
Write-Host "3.1 Wrong Password (expect 401)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/admin/auth/login" -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"admin@vedgrow.dev","password":"wrongpassword"}'
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# 3.2 Login with correct credentials
Write-Host "`n3.2 Admin Login" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@vedgrow.dev"
    password = "Admin@123"
} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BASE/admin/auth/login" -Method POST `
    -ContentType "application/json" -Body $loginBody
$TOKEN = $login.data.accessToken
Write-Host "Logged in as: $($login.data.admin.email)" -ForegroundColor Green
Write-Host "Role: $($login.data.admin.role)" -ForegroundColor Green
# Expected: accessToken + admin details

# 3.3 Get current admin (protected)
Write-Host "`n3.3 GET /me (protected)" -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $TOKEN" }
$me = Invoke-RestMethod -Uri "$BASE/admin/auth/me" -Headers $headers
Write-Host "Current admin: $($me.data.admin.fullName)" -ForegroundColor Green

# 3.4 Protected route without token
Write-Host "`n3.4 Protected Route Without Token (expect 401)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/admin/applications"
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 4: BATCH MANAGEMENT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 4.1 Get track ID for batch creation
$trackId = $tracks.data.tracks[0].id
Write-Host "Using track: $($tracks.data.tracks[0].name) ($trackId)" -ForegroundColor Yellow

# 4.2 Create batch with invalid start date
Write-Host "`n4.2 Invalid Batch Date (expect 400)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/admin/batches" -Method POST `
        -Headers $headers -ContentType "application/json" `
        -Body (@{ trackId = $trackId; startDate = "2025-03-07" } | ConvertTo-Json)
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# 4.3 Create valid batch
Write-Host "`n4.3 Create Valid Batch" -ForegroundColor Yellow
$batchBody = @{
    trackId = $trackId
    startDate = "2025-04-01"
} | ConvertTo-Json
$batch = Invoke-RestMethod -Uri "$BASE/admin/batches" -Method POST `
    -Headers $headers -ContentType "application/json" -Body $batchBody
$BATCH_ID = $batch.data.batch.id
Write-Host "Batch ID: $BATCH_ID" -ForegroundColor Green
Write-Host "Status: $($batch.data.batch.status)"
# Expected: status: "OPEN"

# 4.4 Manually mark application as paid in DB, then assign to batch
# (In real flow, payment webhook does this automatically)
Write-Host "`n4.4 List Batches" -ForegroundColor Yellow
$batches = Invoke-RestMethod -Uri "$BASE/admin/batches" -Headers $headers
Write-Host "Total batches: $($batches.meta.total)" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 5: APPLICATION MANAGEMENT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 5.1 List all applications
Write-Host "5.1 List Applications" -ForegroundColor Yellow
$apps = Invoke-RestMethod -Uri "$BASE/admin/applications" -Headers $headers
Write-Host "Total applications: $($apps.meta.total)" -ForegroundColor Green

# 5.2 Get single application
Write-Host "`n5.2 Get Application By ID" -ForegroundColor Yellow
$singleApp = Invoke-RestMethod -Uri "$BASE/admin/applications/$APP_ID" `
    -Headers $headers
Write-Host "Applicant: $($singleApp.data.application.user.fullName)" -ForegroundColor Green
Write-Host "Status: $($singleApp.data.application.status)"

# 5.3 Filter by payment status
Write-Host "`n5.3 Filter by Payment Status" -ForegroundColor Yellow
$pending = Invoke-RestMethod `
    -Uri "$BASE/admin/applications?paymentStatus=PENDING" -Headers $headers
Write-Host "Pending payment count: $($pending.meta.total)" -ForegroundColor Green

# 5.4 Search by name
Write-Host "`n5.4 Search Applications" -ForegroundColor Yellow
$search = Invoke-RestMethod `
    -Uri "$BASE/admin/applications?search=test" -Headers $headers
Write-Host "Search results: $($search.meta.total)" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 6: CERTIFICATE FLOW" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 6.1 Try to generate certificate for non-completed application (expect 400)
Write-Host "6.1 Generate Cert for Incomplete App (expect 400)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/certificates/admin/generate" -Method POST `
        -Headers $headers -ContentType "application/json" `
        -Body (@{ applicationId = $APP_ID } | ConvertTo-Json)
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}
# Expected: 400 APPLICATION_NOT_COMPLETED

# 6.2 Manually mark application as COMPLETED in Prisma Studio
# Then run this:
Write-Host "`n6.2 (Manual step needed)" -ForegroundColor Magenta
Write-Host "Open Prisma Studio and set application status to COMPLETED" -ForegroundColor Magenta
Write-Host "Also set paymentStatus to COMPLETED" -ForegroundColor Magenta
Write-Host "Then press Enter to continue..." -ForegroundColor Magenta
Read-Host

# 6.3 Generate certificate
Write-Host "6.3 Generate Certificate" -ForegroundColor Yellow
$cert = Invoke-RestMethod -Uri "$BASE/certificates/admin/generate" -Method POST `
    -Headers $headers -ContentType "application/json" `
    -Body (@{ applicationId = $APP_ID } | ConvertTo-Json)
$CIN = $cert.data.certificate.cin
Write-Host "CIN: $CIN" -ForegroundColor Green
# Expected: CIN in format PI-YYMMDD-XXXXX

# 6.4 Verify before activation (expect pending)
Write-Host "`n6.4 Verify Before Activation (expect pending)" -ForegroundColor Yellow
$verify1 = Invoke-RestMethod -Uri "$BASE/certificates/verify?cin=$CIN"
Write-Host "Status: $($verify1.error.code)" -ForegroundColor Green
# Expected: CERTIFICATE_PENDING

# 6.5 Activate certificate
Write-Host "`n6.5 Activate Certificate" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BASE/certificates/admin/$CIN/activate" `
    -Method POST -Headers $headers | ConvertTo-Json
# Expected: isActivated: true

# 6.6 Verify after activation (expect valid)
Write-Host "`n6.6 Verify After Activation (expect valid)" -ForegroundColor Yellow
$verify2 = Invoke-RestMethod -Uri "$BASE/certificates/verify?cin=$CIN"
Write-Host "Status: $($verify2.data.status)" -ForegroundColor Green
Write-Host "Holder: $($verify2.data.holderName)" -ForegroundColor Green
Write-Host "Track: $($verify2.data.trackName)" -ForegroundColor Green
# Expected: status: "valid"

# 6.7 Invalid CIN
Write-Host "`n6.7 Invalid CIN (expect 404)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/certificates/verify?cin=PI-000000-ZZZZZ"
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 7: CONTACT FORM" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 7.1 Submit contact form
Write-Host "7.1 Submit Contact Form" -ForegroundColor Yellow
$contact = Invoke-RestMethod -Uri "$BASE/contact" -Method POST `
    -ContentType "application/json" `
    -Body (@{
        fullName = "Help Needed"
        email = "help@example.com"
        message = "I need help with my application status."
    } | ConvertTo-Json)
$CONTACT_ID = $contact.data.submissionId
Write-Host "Submission ID: $CONTACT_ID" -ForegroundColor Green

# 7.2 Short message validation
Write-Host "`n7.2 Short Message (expect 422)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE/contact" -Method POST `
        -ContentType "application/json" `
        -Body (@{ fullName="X"; email="x@x.com"; message="Hi" } | ConvertTo-Json)
} catch {
    Write-Host "Got expected error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# 7.3 List unresolved contacts
Write-Host "`n7.3 List Unresolved Contacts" -ForegroundColor Yellow
$contacts = Invoke-RestMethod `
    -Uri "$BASE/contact/admin?isResolved=false" -Headers $headers
Write-Host "Unresolved count: $($contacts.meta.total)" -ForegroundColor Green

# 7.4 Resolve contact
Write-Host "`n7.4 Resolve Contact" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BASE/contact/admin/$CONTACT_ID/resolve" `
    -Method PATCH -Headers $headers | ConvertTo-Json

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 8: ANALYTICS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 8.1 Dashboard stats
Write-Host "8.1 Dashboard Analytics" -ForegroundColor Yellow
$dashboard = Invoke-RestMethod `
    -Uri "$BASE/admin/analytics/dashboard" -Headers $headers
Write-Host "Total applications: $($dashboard.data.overview.totalApplications)" -ForegroundColor Green
Write-Host "Payment conversion: $($dashboard.data.overview.paymentConversionRate)%" -ForegroundColor Green
Write-Host "Certificates issued: $($dashboard.data.pipeline.certificatesIssued)" -ForegroundColor Green

# 8.2 Funnel
Write-Host "`n8.2 Conversion Funnel" -ForegroundColor Yellow
$funnel = Invoke-RestMethod `
    -Uri "$BASE/admin/analytics/funnel" -Headers $headers
foreach ($stage in $funnel.data.funnel) {
    Write-Host "$($stage.stage): $($stage.count) ($($stage.conversionFromPrevious)%)" -ForegroundColor Green
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " PHASE 9: EMAIL LOGS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# 9.1 List all email logs
Write-Host "9.1 Email Logs" -ForegroundColor Yellow
$emails = Invoke-RestMethod -Uri "$BASE/admin/emails" -Headers $headers
Write-Host "Total email log entries: $($emails.meta.total)" -ForegroundColor Green
foreach ($log in $emails.data.logs) {
    Write-Host "  $($log.templateName) → $($log.status)" -ForegroundColor Green
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host " ALL TESTS COMPLETE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
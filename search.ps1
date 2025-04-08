param(
    [string]$searchValue = "",
    [int]$page = 1
)

$endpoint = "http://localhost:3000/api/search?searchValue=$searchValue&page=$page"

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Get

    Write-Host "`n--- Search: '$searchValue' | Page $($response.page) of $($response.totalPages) ---`n"

    $response.data | Format-Table contact_id, name, phone_number, timestamp -AutoSize
} catch {
    Write-Error "Search failed: $_"
}

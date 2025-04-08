param(
  [int]$page = 1
)

Invoke-RestMethod "http://localhost:3000/api/page?page=$page" | ConvertTo-Json -Depth 5 

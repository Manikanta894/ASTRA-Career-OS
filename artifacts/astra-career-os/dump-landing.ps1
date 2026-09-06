$content = Get-Content src\App.tsx
Write-Output "===== LINES 226-240 (Landing) ====="
for ($i = 225; $i -le 239; $i++) {
  Write-Output ("LINE {0}: {1}" -f ($i + 1), $content[$i])
}
Write-Output ""
Write-Output "===== LINES 50-56 (seed start) ====="
for ($i = 49; $i -le 55; $i++) {
  Write-Output ("LINE {0}: {1}" -f ($i + 1), $content[$i])
}
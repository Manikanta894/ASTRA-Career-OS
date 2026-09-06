$content = Get-Content src\App.tsx
Write-Output ("TOTAL_LINES=" + $content.Count)
for ($i = 0; $i -lt $content.Count; $i++) {
  $line = $content[$i]
  if ($line -match '^(function|type|export default|const .* = \()') {
    $trim = $line.Trim()
    if ($trim.Length -gt 100) { $trim = $trim.Substring(0, 100) + '...' }
    Write-Output ("{0}: {1}" -f ($i + 1), $trim)
  }
}
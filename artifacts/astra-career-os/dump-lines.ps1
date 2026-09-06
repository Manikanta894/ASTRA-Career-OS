$content = Get-Content src\App.tsx
foreach ($lineNo in @(233, 234)) {
  Write-Output ("===== LINE {0} ({1} chars) =====" -f $lineNo, $content[$lineNo-1].Length)
  Write-Output $content[$lineNo-1]
}
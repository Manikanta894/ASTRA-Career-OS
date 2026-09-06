$c = Get-Content node_modules\lucide-react\dist\lucide-react.d.ts -Raw
foreach ($n in 'UsersRound','Infinity','FileCheck2','Orbit','Trophy','ShieldCheck','Folder','BarChart3','GraduationCap','Sparkles','Zap','Activity','ArrowRight','Map','Award','Users','MessageCircle') {
  Write-Output ("{0}={1}" -f $n, $c.Contains($n))
}
# Estrae il poster dei video 2025 e ne misura dimensioni e durata.
$ff  = 'C:\Users\carmen manuela\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe'
$fp  = $ff -replace 'ffmpeg\.exe$', 'ffprobe.exe'
$v   = 'C:\Users\carmen manuela\Documents\Sito web Opencode\assets\video\artdecoeur2025'
$i   = 'C:\Users\carmen manuela\Documents\Sito web Opencode\assets\img\artdecoeur2025'
$tmp = 'C:\Users\carmen manuela\AppData\Local\Temp\opencode'
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp -Force | Out-Null }

foreach ($n in 1..3) {
  $mp4 = "$v\video-0$($n).mp4"
  $dur = & $fp -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $mp4
  $lar = & $fp -v error -select_streams v:0 -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 $mp4
  $alt = & $fp -v error -select_streams v:0 -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 $mp4
  $d = [double]$dur
  # campione un fotogramma al 25% della durata, evitando l'eventuale dissolvenza iniziale
  $t = [math]::Round($d * 0.25, 2)
  "video-0$($n): $lar x $alt   $([math]::Round($d,1)) s   poster a $t s"
  & $ff -y -hide_banner -loglevel error -ss $t -i $mp4 -frames:v 1 "$tmp\poster-$n.png"
  if ($LASTEXITCODE -ne 0) { "  ERRORE estrazione" }
}

Get-ChildItem $tmp -Filter 'poster-*.png' | ForEach-Object { "  " + $_.Name + "  " + [math]::Round($_.Length/1KB,0) + " KB" }

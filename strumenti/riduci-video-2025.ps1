# Riduce i tre video della Design week 2025 in formati adatti al web.
#
# Sorgenti (D:\Materiali sito\design-week\materiali\2025-art-de-coeur\Gallery_video),
# nell'ordine che ha scelto l'utente rinominando i file con un numero davanti:
#   1_Art De Coeur_Promo.mp4                h264  1280x720    9,3 MB
#   2_Art De Coeur_Making of...tessitura    h264  1080x1920  28,9 MB
#   3_Art De Coeur_L'esposizione.mp4        HEVC 10 bit 1080x1920  87,9 MB
#
# L'HEVC a 10 bit non viene riprodotto da Chrome e Firefox, quindi va
# convertito in h264. Gli altri due sono gia' h264: si abbassa il bitrate.
# Il risultato va in assets/video/artdecoeur2025/ come video-01/02/03.mp4,
# con lo stesso numero della sorgente, cosi' l'ordine resta quello deciso.
$ErrorActionPreference = 'Stop'

$ff = 'C:\Users\carmen manuela\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe'
$src = 'D:\Materiali sito\design-week\materiali\2025-art-de-coeur\Gallery_video'
$dst = 'C:\Users\carmen manuela\Documents\Sito web Opencode\assets\video\artdecoeur2025'

New-Item -ItemType Directory -Force -Path $dst | Out-Null

# crf 23 con preset slow: buona qualita' a dimensioni contenute. L'audio resta
# aac a 128 kbit, e faststart fa iniziare la riproduzione prima che il file
# sia finito di scaricare.
function Riduci($ingresso, $uscita, $crf) {
    Write-Output "--- " + (Split-Path $ingresso -Leaf) + "  ->  " + (Split-Path $uscita -Leaf) + "   (crf $crf)"
    & $ff -y -hide_banner -loglevel error -stats `
        -i $ingresso `
        -map 0:v:0 -map 0:a:0? `
        -c:v libx264 -preset slow -crf $crf -pix_fmt yuv420p `
        -c:a aac -b:a 128k `
        -movflags +faststart `
        $uscita
    if ($LASTEXITCODE -ne 0) { Write-Output "  ERRORE ffmpeg ($LASTEXITCODE)"; return }
    $a = (Get-Item $ingresso).Length
    $b = (Get-Item $uscita).Length
    Write-Output ("  {0:N1} MB  ->  {1:N1} MB   (-{2:N0}%)" -f ($a/1MB), ($b/1MB), (100 - $b*100/$a))
}

# Get-ChildItem con filtro, perche' i nomi con accenti vengono alterati da
# PowerShell quando li si scrive letteralmente dentro lo script.
foreach ($n in 1..3) {
    $s = Get-ChildItem $src -File | Where-Object { $_.Name -like "$n`_*" } | Select-Object -First 1
    if (-not $s) { Write-Output "ERRORE: non trovo la sorgente $n in $src"; continue }
    $d = "$dst\video-0$($n).mp4"

    # gia' preparato? allora si salta, cosi' una rilanciata non ricodifica tutto
    if ((Test-Path $d) -and ((Get-Item $d).LastWriteTime -gt $s.LastWriteTime)) {
        Write-Output "--- " + $s.Name + "  ->  video-0$($n).mp4   gia' pronta, saltata"
        continue
    }

    # HEVC a 10 bit: non riprodotto da Chrome e Firefox, va convertito.
    $codec = & $ff -hide_banner -i $s.FullName -map 0:v:0 -c copy -f null NUL 2>&1 |
        Select-String -Pattern 'Stream #.*Video:.*\[(\w+)\]' |
        ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -First 1

    if ($codec -match 'hevc') {
        Riduci $s.FullName $d 23
    } else {
        # gia' h264: nessuna ricodifica, si mette solo l'ordine rapido
        Write-Output "--- " + $s.Name + "  ->  video-0$($n).mp4   (solo riordino, nessuna ricodifica)"
        & $ff -y -hide_banner -loglevel error -stats -i $s.FullName `
            -map 0:v:0 -map 0:a:0? -c copy -movflags +faststart $d
        $a = $s.Length
        $b = (Get-Item $d).Length
        Write-Output ("  {0:N1} MB  ->  {1:N1} MB" -f ($a/1MB), ($b/1MB))
    }
}

Write-Output ""
Write-Output "--- esito"
Get-ChildItem $dst -File | ForEach-Object { "  {0,-14} {1,7:N1} MB" -f $_.Name, ($_.Length/1MB) }
$t = (Get-ChildItem $dst -File | Measure-Object Length -Sum).Sum
Write-Output ("  totale: {0:N1} MB   (prima: {1:N1} MB)" -f ($t/1MB), ((Get-ChildItem $src -File | Measure-Object Length -Sum).Sum/1MB))

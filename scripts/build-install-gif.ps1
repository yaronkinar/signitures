$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$framesDir = Join-Path $root "images\install-gif-frames"
$textDir = Join-Path $framesDir "text"
$gifPath = Join-Path $root "images\install-outlook.gif"
$font = "images/fonts/arial.ttf"

New-Item -ItemType Directory -Force -Path $framesDir, $textDir, (Join-Path $root "images\fonts") | Out-Null
if (-not (Test-Path (Join-Path $root "images\fonts\arial.ttf"))) {
  Copy-Item "C:\Windows\Fonts\arial.ttf" (Join-Path $root "images\fonts\arial.ttf")
}

$steps = @(
  @("Step 1 / 4", "Fill details and click Generate signature"),
  @("Step 2 / 4", "Click Install to Outlook"),
  @("Step 3 / 4", "Run run-install-outlook-signature.bat"),
  @("Step 4 / 4", "Restart Outlook - signature is ready")
)

Push-Location $root
try {
  for ($i = 0; $i -lt $steps.Count; $i++) {
    $frame = $i + 1
    $out = "images/install-gif-frames/frame-{0:D2}.png" -f $frame
    $t1raw = Join-Path $textDir "line1-$frame.txt"
    $t2raw = Join-Path $textDir "line2-$frame.txt"
    $t1 = "images/install-gif-frames/text/line1-$frame.txt"
    $t2 = "images/install-gif-frames/text/line2-$frame.txt"
    Set-Content -Path $t1raw -Value $steps[$i][0] -Encoding UTF8
    Set-Content -Path $t2raw -Value $steps[$i][1] -Encoding UTF8
    $filterPath = Join-Path $textDir "filter-$frame.txt"
    @(
      "drawtext=fontfile=$font`:textfile=$t1`:fontsize=28:fontcolor=0x1d4ed8:x=(w-text_w)/2:y=h/2-50",
      "drawtext=fontfile=$font`:textfile=$t2`:fontsize=22:fontcolor=0x374151:x=(w-text_w)/2:y=h/2+10"
    ) -join ',' | Set-Content -Path $filterPath -Encoding ascii
    & ffmpeg -y -f lavfi -i "color=c=0xf0f4f9:s=960x540:d=1" -frames:v 1 -filter_script $filterPath $out
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed on frame $frame" }
  }

  $inputPattern = "images/install-gif-frames/frame-%02d.png"
  $gifFilterPath = Join-Path $textDir "gif-filter.txt"
  Set-Content -Path $gifFilterPath -Value "fps=8,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" -Encoding ascii
  & ffmpeg -y -framerate 0.4 -i $inputPattern -filter_script $gifFilterPath -loop 0 "images/install-outlook.gif"
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg gif build failed" }
}
finally {
  Pop-Location
}

Write-Host "Created $gifPath"

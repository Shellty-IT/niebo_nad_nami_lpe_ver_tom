param(
  [string]$VoiceName = 'Microsoft Paulina Desktop'
)

$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path (Split-Path -Parent $appRoot) '02-scenariusz/teksty-poziomow-p4.json'
$targetDirectory = Join-Path $appRoot 'public/media/p4'
New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthesizer.SelectVoice($VoiceName)
$content = Get-Content -LiteralPath $sourcePath -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($scene in $content.scenes) {
  foreach ($level in @('basic', 'extended', 'expert')) {
    $audio = New-Object System.IO.MemoryStream
    try {
      $synthesizer.SetOutputToWaveStream($audio)
      $synthesizer.Speak([string]$scene.$level)
      $synthesizer.SetOutputToNull()
      $audio.Position = 0
      $suffix = if ($level -eq 'basic') { '' } else { '-' + $level }
      $outputPath = Join-Path $targetDirectory ($scene.id.ToLowerInvariant() + $suffix + '-narracja.mp3')
      $processInfo = New-Object System.Diagnostics.ProcessStartInfo
      $processInfo.FileName = 'ffmpeg'
      $processInfo.Arguments = '-v error -n -f wav -i pipe:0 -ac 1 -ar 48000 -b:a 128k ' + '"' + $outputPath + '"'
      $processInfo.UseShellExecute = $false
      $processInfo.RedirectStandardInput = $true
      $process = [System.Diagnostics.Process]::Start($processInfo)
      try {
        $audio.CopyTo($process.StandardInput.BaseStream)
        $process.StandardInput.Close()
        $process.WaitForExit()
        if ($process.ExitCode -ne 0) { throw "ffmpeg nie utworzył $outputPath" }
      } finally { $process.Dispose() }
    } finally { $audio.Dispose() }
  }
}
$synthesizer.Dispose()

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'
$backendLog = Join-Path $root 'backend-smoke.log'
$backendErr = Join-Path $root 'backend-smoke.err.log'
$frontendLog = Join-Path $root 'frontend-smoke.log'
$frontendErr = Join-Path $root 'frontend-smoke.err.log'

function Stop-PortProcesses {
  param([int[]]$Ports)

  foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
      Where-Object { $_.State -eq 'Listen' -and $_.OwningProcess -gt 0 } |
      Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $connections) {
      try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
      } catch {
        Write-Warning "无法终止占用端口 $port 的进程 $processId：$($_.Exception.Message)"
      }
    }
  }
}

function Wait-HttpReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  throw "等待服务就绪超时：$Url"
}

Remove-Item $backendLog, $backendErr, $frontendLog, $frontendErr -ErrorAction SilentlyContinue
Stop-PortProcesses -Ports @(5173, 8000)

$backend = $null
$frontend = $null

try {
  $backend = Start-Process python `
    -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000' `
    -WorkingDirectory $backendDir `
    -RedirectStandardOutput $backendLog `
    -RedirectStandardError $backendErr `
    -PassThru

  $frontend = Start-Process 'C:\Windows\System32\cmd.exe' `
    -ArgumentList '/c', 'npm run dev -- --host 127.0.0.1 --port 5173' `
    -WorkingDirectory $frontendDir `
    -RedirectStandardOutput $frontendLog `
    -RedirectStandardError $frontendErr `
    -PassThru

  Wait-HttpReady -Url 'http://127.0.0.1:8000/api/health'
  Wait-HttpReady -Url 'http://127.0.0.1:8000/api/tasks'
  Wait-HttpReady -Url 'http://127.0.0.1:5173'

  playwright-cli close-all | Out-Null
  playwright-cli open http://127.0.0.1:5173 | Out-Null
  playwright-cli run-code @"
async page => {
  await page.getByRole('button', { name: '新建订单' }).click();
  await page.getByPlaceholder('例如：王小姐的春季上新 / 批次 A...').fill('烟测订单');
  await page.getByRole('button', { name: '进入专属工作台' }).click();
  await page.waitForURL(/\/generate\//);
  await page.getByRole('button', { name: '立即生成' }).click();
  await page.waitForURL(/\/result\//);
}
"@ | Out-Null
  Start-Sleep -Seconds 3

  $pageUrl = (playwright-cli --raw eval "location.href").Trim('"', "`r", "`n", ' ')
  $pageText = (playwright-cli --raw eval "document.body.innerText").Trim('"')
  $console = playwright-cli console
  $network = playwright-cli network

  if (-not $pageUrl.Contains('/result/')) {
    throw "烟测失败：点击开始生成后未跳转到结果页。当前地址：$pageUrl"
  }

  if (-not ($pageText.Contains('生成状态') -or $pageText.Contains('任务状态读取失败') -or $pageText.Contains('渲染结果已就绪'))) {
    throw "烟测失败：结果页未出现预期状态文案。"
  }

  Write-Output 'SMOKE_OK'
  Write-Output "PAGE_URL=$pageUrl"
  Write-Output '---PLAYWRIGHT_CONSOLE---'
  Write-Output $console
  Write-Output '---PLAYWRIGHT_NETWORK---'
  Write-Output $network
  Write-Output '---BACKEND_STDOUT---'
  if (Test-Path $backendLog) { Get-Content $backendLog -Raw }
  Write-Output '---BACKEND_STDERR---'
  if (Test-Path $backendErr) { Get-Content $backendErr -Raw }
  Write-Output '---FRONTEND_STDOUT---'
  if (Test-Path $frontendLog) { Get-Content $frontendLog -Raw }
  Write-Output '---FRONTEND_STDERR---'
  if (Test-Path $frontendErr) { Get-Content $frontendErr -Raw }
} catch {
  Write-Output 'SMOKE_FAIL'
  Write-Output $_.Exception.Message
  throw
} finally {
  playwright-cli close-all | Out-Null
  if ($frontend -and -not $frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
  if ($backend -and -not $backend.HasExited) { Stop-Process -Id $backend.Id -Force }
}

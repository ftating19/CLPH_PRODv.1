# PowerShell script to add apiUrl import and replace all API URL patterns
$files = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.js,*.jsx -Exclude node_modules,.next,update-api-urls.ps1

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        $modified = $false
        
        # Check if file contains API URLs that need fixing
        $needsFix = $content -match "process\.env\.NEXT_PUBLIC_API_URL \|\| ['\`"]http://localhost:4000"
        
        if ($needsFix) {
            # Check if apiUrl is already imported
            $hasApiUrlImport = $content -match "import.*apiUrl.*from.*['\`"]@/lib/api-config['\`"]"
            
            # Add import if not present and file has imports
            if (-not $hasApiUrlImport -and $content -match "^import") {
                # Find the last import statement
                $lines = $content -split "`n"
                $lastImportIndex = -1
                for ($i = 0; $i -lt $lines.Count; $i++) {
                    if ($lines[$i] -match "^import") {
                        $lastImportIndex = $i
                    }
                }
                
                if ($lastImportIndex -ge 0) {
                    # Insert the import after the last import
                    $lines = @($lines[0..$lastImportIndex]) + "import { apiUrl } from '@/lib/api-config'" + @($lines[($lastImportIndex + 1)..($lines.Count - 1)])
                    $content = $lines -join "`n"
                    $modified = $true
                }
            }
            
            # Replace inline environment variable checks with apiUrl function calls
            # Pattern 1: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/... -> apiUrl('/api/...')
            $content = $content -replace '\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| [''"]http://localhost:4000[''"]}/api/', "apiUrl('/api/"
            
            # Pattern 2: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/... -> apiUrl(`/api/...
            $content = $content -replace '`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| "http://localhost:4000"}/api/', "apiUrl(`/api/"
            
            # Pattern 3: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000' followed by string concatenation
            $content = $content -replace "process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:4000'", "apiUrl('')"
            $content = $content -replace 'process\.env\.NEXT_PUBLIC_API_URL \|\| "http://localhost:4000"', 'apiUrl("")'
            
            $modified = $true
        }
        
        if ($modified -and $content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error processing $($file.FullName): $_" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! All files have been updated." -ForegroundColor Cyan

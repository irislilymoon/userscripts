@echo off
set "target_dir=D:\Steam\steamapps\common\ForzaHorizon6\media\Stripped\StringTables"
set "chs_file=%target_dir%\CHS.zip"
set "jp_file=%target_dir%\JP.zip"
set "temp_file=%target_dir%\TEMP_SWAP.zip"

if not exist "%chs_file%" exit /b
if not exist "%jp_file%" exit /b

ren "%chs_file%" TEMP_SWAP.zip
ren "%jp_file%" CHS.zip
ren "%temp_file%" JP.zip

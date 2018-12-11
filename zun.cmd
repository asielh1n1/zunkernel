
@SETLOCAL
@SET PATHEXT=%PATHEXT:;.JS;=;%
node  "%~dp0node_modules/zunkernel/zun-cli.js" %*
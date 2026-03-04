@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.2
@REM
@REM Optional ENV vars
@REM   JAVA_HOME - location of a JDK home dir, required when download maven via java source
@REM   MVNW_REPOURL - repo url base for downloading maven distribution
@REM   MVNW_USERNAME/MVNW_PASSWORD - user and password for downloading maven
@REM   MVNW_VERBOSE - true: enable verbose log
@REM ----------------------------------------------------------------------------

@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_WRAPPERDIR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper
set MAVEN_PROPERTIES_FILE=%MAVEN_WRAPPERDIR%\maven-wrapper.properties

@REM Default Maven version
set DEFAULT_MVN=3.9.9

if exist "%MAVEN_PROPERTIES_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%MAVEN_PROPERTIES_FILE%") do (
        if "%%a"=="distributionUrl" set DOWNLOAD_URL=%%b
    )
)

if not defined DOWNLOAD_URL (
    set DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%DEFAULT_MVN%/apache-maven-%DEFAULT_MVN%-bin.zip
)

@REM Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. >&2
goto error

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%\bin\java.exe

if exist "%JAVA_EXE%" goto execute
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% >&2
goto error

:execute

set MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%DEFAULT_MVN%
if exist "%MAVEN_HOME%\bin\mvn.cmd" goto runMaven

echo Downloading Maven from: %DOWNLOAD_URL%
set DOWNLOAD_FILE=%TEMP%\maven-wrapper-download.zip

@REM Try PowerShell download
powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%DOWNLOAD_FILE%' }" >NUL 2>&1
if "%ERRORLEVEL%" neq "0" (
    echo ERROR: Failed to download Maven distribution >&2
    goto error
)

@REM Unzip
powershell -Command "& { Expand-Archive -Path '%DOWNLOAD_FILE%' -DestinationPath '%USERPROFILE%\.m2\wrapper\dists' -Force }" >NUL 2>&1
if "%ERRORLEVEL%" neq "0" (
    echo ERROR: Failed to unzip Maven distribution >&2
    goto error
)

del "%DOWNLOAD_FILE%" >NUL 2>&1

:runMaven
"%MAVEN_HOME%\bin\mvn.cmd" %*
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
endlocal & exit /b %ERROR_CODE%

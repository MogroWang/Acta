Unicode True
!include "MUI2.nsh"
!cd ".."

!define PRODUCT_NAME "Acta 行记"
!define PRODUCT_VERSION "1.0.002 DEV"
!define PRODUCT_PUBLISHER "MogroWang Studio"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "release\Acta-1.0.002-DEV-windows-setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Acta"
InstallDirRegKey HKCU "Software\Acta" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "build\icon.ico"
UninstallIcon "build\icon.ico"

!define MUI_ABORTWARNING
!define MUI_ICON "build\icon.ico"
!define MUI_UNICON "build\icon.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Acta.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

Section "Acta" SEC_MAIN
  SetOutPath "$INSTDIR"
  File /r "dist\win-unpacked\*.*"
  WriteUninstaller "$INSTDIR\Uninstall Acta.exe"
  WriteRegStr HKCU "Software\Acta" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Acta" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Acta" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Acta" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Acta" "UninstallString" '"$INSTDIR\Uninstall Acta.exe"'
  CreateDirectory "$SMPROGRAMS\Acta 行记"
  CreateShortcut "$SMPROGRAMS\Acta 行记\Acta 行记.lnk" "$INSTDIR\Acta.exe"
  CreateShortcut "$DESKTOP\Acta 行记.lnk" "$INSTDIR\Acta.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\Acta 行记.lnk"
  RMDir /r "$SMPROGRAMS\Acta 行记"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Acta"
  DeleteRegKey HKCU "Software\Acta"
  RMDir /r "$INSTDIR"
SectionEnd

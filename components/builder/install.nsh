!macro customInstall
  CreateDirectory $PROFILE\AppData\Roaming\emu-base
  CopyFiles $INSTDIR\defaults $PROFILE\AppData\Roaming\emu-base
  Delete $INSTDIR\defaults
!macroend
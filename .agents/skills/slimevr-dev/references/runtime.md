# Runtime and Diagnostics Reference

## Launch and Stop

```bash
bash "Launch SlimeVR.command"
bash "Stop SlimeVR.command"
```

The launcher starts the Electron development host and the packaged server JAR. Lifecycle changes must preserve single-instance behavior and stop only descendants or exact path-matched project processes.

## Logs and Ports

```bash
tail -f ~/Library/Logs/dev.slimevr.SlimeVR/main.log
lsof -nP -iTCP:21110 -sTCP:LISTEN
lsof -nP -iUDP:6969
```

Prefer logs and listener ownership over guessing. A busy port can be another valid instance or an orphan; identify the PID and command before acting.

## Quest ADB

Resolve the installed `adb` path through the app helper. For legacy wireless ADB, a reliable sequence is USB authorization, `adb -s <serial> tcpip 5555`, host daemon restart when necessary, then `adb connect <quest-ip>:5555`. Quest firmware and network isolation can affect availability.

Do not assume a Wi-Fi address is reachable merely because it is syntactically valid. Distinguish USB serials from `ip:port` transports and preserve the user's selected device.

## Quest Audio

scrcpy produces separate `output` and `mic` sources. On macOS, this project creates named executable copies so Loopback can distinguish `Quest Game Audio` and `Quest Mic`.

`--no-audio-playback` also removes the Mac playback stream that Loopback application capture needs. Local audibility should therefore be controlled through Loopback's application-source capture and Monitor configuration, not by disabling scrcpy playback unless capture is redesigned around another audio transport.

Capture stderr and exit codes, keep each source process independently stoppable, and clean both up during Electron shutdown.

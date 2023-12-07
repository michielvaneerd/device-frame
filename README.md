# Device frame

Adds a device frame to all simulator screenshots in a directory.

## Set up

This script requires the frames from the below download to be present on your system:

https://design.facebook.com/toolsandresources/devices/

See the [frames.json](./src/frames.json) file for available frames and the names you should give to the frames.
For example the iPhone 14 Pro Max frame should be called iphone_14_pro_max.png.

Put them in `~/device-frame`. This location can be adjusted if you want by specifying the `~/.device-frame.json` file:

```json
{
    "deviceFramePath": "some/location"
}
```

Note that the iOS frames should be placed inside the `ios` and Android inside the `android` subdirectory. So for example you will have:

```shell
~/device-frame/ios/iphone_14_pro_max.png
~/device-frame/ios/iphone_se.png
~/device-frame/android/pixel_5.png
```

## Calling the script

Add frames to all simulator screenshots in the `screens` directory:

```shell
device-frame ios screens
```

This will add a frame to all screenshots and put them in the currect directory with `_framed` appended to the name, for example:

`screen1.png` will become `screen1_framed.png`.

## Validating your frames

This will validate all your frames to make sure they have the correct name and dimensions.

```shell
device-frame validate
```

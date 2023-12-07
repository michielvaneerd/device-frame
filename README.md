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

## Adding new devices

Devices are defined in the [frames.json](./src/frames.json) file. For a device frame to be used, you need to add an entry to this file and download a device frame PNG.

```json
{
    "1290x2796": {
        "frameWidth": 3242,
        "frameHeight": 6270,
        "screenShotWidth": 1290,
        "screenShotHeight": 2796,
        "innerLeft": 334,
        "innerTop": 310,
        "innerWidth": 2580,
        "innerHeight": 5592,
        "cornerCutWidth": 80,
        "inch": 6.7,
        "name": "iphone_14_pro_max.png",
        "devices": [
            "iPhone 14 Pro Max",
            "iPhone 15 Pro Max"
        ]
    }
}
```

The key of a device is the `width`x`height` in pixels of the simulator screenshot. For example screenshots of the iPhone 14 Pro Max device are 1290x2796 pixels, so this is the key. The other fields:

- `frameWidth` and `frameHeight` - Width and height of the device frame image.
- `screenShotWidth` and `screenShotHeight` - Width and height of the simulator screenshot images, so this will be the same as the key of this device.
- `innerLeft` and `innerTop` - The left and top position of the start of the inner frame - this is where the simulator screenshot should be placed.
- `innerWidth` and `innerHeight` - The width and height of the inner frame - this is the size that is available for the simulator screenshot.
- `cornerCutWidth` - The width and height of the 4 corners that should be cut out (made transparent). If this is not needed, specify 0 (zero).
- `inch` - Not used in this script, just for informational purposes.
- `name` - Name of the frame image.
- `devices` - Not used in this script, just for informational purposes.
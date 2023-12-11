# Device frame

Adds a device frame to all simulator screenshots in a directory.

## Getting started

Download the device frames from:

https://design.facebook.com/toolsandresources/devices/

Unzip this and also the subdirecties in it and place it into your home directory. Now it looks like this:

```shell
~/Meta Devices/Phones/Apple iPhone 14 Pro Max/Device/iPhone 14 Pro Max – Space Black.png
~/Meta Devices/Phones/Google Pixel 5/Device/Google Pixel 5 Just Black.png
~/Meta Devices/Tablets/Apple iPad Air 2020/Device/Apple iPad Air 2020 Space Gray Portrait.png
```

See the [frames.json](./src/frames.json) file for available frames. Others can be added by adding them to the frames.json file.

## Validating your frames

This will check if all frames defined in frames.json are available on yor system:

```shell
device-frame validate
```

## Calling the script

Add frames to all iOS simulator screenshots in the `~/screens` directory and put them in the `~/destination` directory:

```shell
device-frame ios ~/screens ~/destination
```

Add frames to all Android simulator screenshots in the `~/screens` directory and put them in the `~/destination` directory:

```shell
device-frame android ~/screens ~/destination
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
        "path": "Phones/Apple iPhone 14 Pro Max/Device/iPhone 14 Pro Max – Space Black.png",
        "inch": 6.7
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
- `path` - Path of the frame image relative to the root directory `Meta Devices`.

## Other resources

Official Apple downloads: https://developer.apple.com/design/resources/#product-bezels

Apple device dimensions: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/

Official add Android device frames to your screenshots: https://developer.android.com/distribute/marketing-tools/device-art-generator
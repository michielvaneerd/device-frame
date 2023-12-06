const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const homeDir = require('os').homedir();

const devicesAndroid = {
    '1080x2340': {
        frameWidth: 1480,
        frameHeight: 2740,
        screenShotWidth: 1080,
        screenShotHeight: 2340,
        innerLeft: 200,
        innerTop: 200,
        innerWidth: 1080,
        innerHeight: 2340,
        cornerCutWidth: 0,
        inch: 6,
        name: 'pixel_5.png',
        devices: [
            'pixel_5'
        ]
    }
};

/**
 * The devices object. The key is the WIDTHxHEIGHT of the screenshot you make with the simulator.
 */
const devicesIos = {
    '1290x2796': {
        frameWidth: 3242,
        frameHeight: 6270,
        screenShotWidth: 1290,
        screenShotHeight: 2796,
        innerLeft: 334,
        innerTop: 310,
        innerWidth: 2580,
        innerHeight: 5592,
        cornerCutWidth: 80,
        inch: 6.7,
        name: 'iphone_14_pro_max.png',
        devices: [
            'iphone_14_pro_max',
            'iphone_15_pro_max'
        ]
    },
    '750x1334': {
        frameWidth: 1050,
        frameHeight: 1934,
        screenShotWidth: 750,
        screenShotHeight: 1334,
        innerLeft: 150,
        innerTop: 300,
        innerWidth: 750,
        innerHeight: 1334,
        cornerCutWidth: 0,
        inch: 4.7,
        name: 'iphone_se.png',
        devices: [
            'iphone_se'
        ]
    }
};

function die(message) {
    console.log(message);
    process.exit();
}

(async function () {

    // Usage: node index.js OS PATH_TO_SCREENSHOT
    // Based on width and height of screenPath, we know which frame we need to get.

    if (process.argv.length < 4) {
        die('Missing os and/or file argument');
    }

    const os = process.argv[2];
    if (['ios', 'android'].indexOf(os) === -1) {
        die('Unknown os');
    }
    const screenPath = process.argv[3];
    const screenPathParts = path.parse(screenPath);

    const devices = os === 'ios' ? devicesIos : devicesAndroid;

    if (!fs.existsSync(screenPath)) {
        die(`${screenPath} does not exist`);
    }

    // Get information for this screen (will be in screenBuffer.info.width and height)
    const screenBuffer = await sharp(screenPath).toFormat('png').toBuffer({
        resolveWithObject: true
    });
    const screenWidth = screenBuffer.info.width;
    const screenHeight = screenBuffer.info.height;
    const deviceKey = `${screenWidth}x${screenHeight}`;

    if (!(deviceKey in devices)) {
        die(`Unknown screenshot width ${screenWidth} and height ${screenHeight}`);
    }

    // Now we will have to resize the frame so the inner size is exactly the same as this screen.
    const device = devices[deviceKey];
    const ratio = device.innerWidth == screenWidth ? 1 : ((device.innerWidth - screenWidth) / device.innerWidth);
    const deviceInnerWidth = screenWidth;
    const deviceInnerHeight = device.innerHeight * ratio;
    const cornerCutWidth = device.cornerCutWidth * ratio;

    const frameDir = os === 'ios' ? 'frames/ios' : 'frames/android';

    const frameBuffer1 = await sharp(`${frameDir}/${device.name}`).resize(device.frameWidth * ratio).toFormat('png').toBuffer();

    const composites = [];
    if (cornerCutWidth) {
        composites.push({
            top: 0,
            left: 0,
            input: {
                create: {
                    width: cornerCutWidth,
                    height: cornerCutWidth,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            },
        });
        composites.push({
            top: 0,
            left: deviceInnerWidth - cornerCutWidth,
            input: {
                create: {
                    width: cornerCutWidth,
                    height: cornerCutWidth,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            },
        });
        composites.push({
            top: deviceInnerHeight - cornerCutWidth,
            left: 0,
            input: {
                create: {
                    width: cornerCutWidth,
                    height: cornerCutWidth,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            },
        });
        composites.push({
            top: deviceInnerHeight - cornerCutWidth,
            left: deviceInnerWidth - cornerCutWidth,
            input: {
                create: {
                    width: cornerCutWidth,
                    height: cornerCutWidth,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            },
        });
    }

    composites.push({
        input: screenBuffer.data,
        blend: 'out'
    });
    
    const image1 = await sharp({
        create: {
            width: deviceInnerWidth,
            height: deviceInnerHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite(composites).toFormat('png').toBuffer();

    await sharp({
        create: {
            width: device.frameWidth * ratio,
            height: device.frameHeight * ratio,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite([
        {
            input: image1,
            top: device.innerTop * ratio,
            left: device.innerLeft * ratio,
        },
        {
            input: frameBuffer1,
        }
    ]).toFile(`${screenPathParts.name}_framed.png`);

})();




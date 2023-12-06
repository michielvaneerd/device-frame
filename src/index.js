const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const homeDir = require('os').homedir();
const frames = require("./frames.json");

function die(message) {
    console.log(message);
    process.exit();
}

let framesPath = `${homeDir}/device-frame`;
if (fs.existsSync(`${homeDir}/.device-frame.json`)) {
    const json = JSON.parse(fs.readFileSync(`${homeDir}/.device-frame.json`, 'utf8'));
    framesPath = json.deviceFramePath;
}

if (!fs.existsSync(framesPath)) {
    die(`Path to device frames doesn't exist.`);
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

    const devices = frames[os];

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

    const frameDir = `${framesPath}/${os}`;

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




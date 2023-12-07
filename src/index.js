const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const homeDir = require('os').homedir();
const frames = require("./frames.json");

const frameCache = {}; // Cache for frames sharp instances

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

function getComposite(top, left, width, height) {
    return {
        top: top,
        left: left,
        input: {
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        },
    };
}

async function frameScreen(screenFullPath, os) {
    const screenBuffer = await sharp(screenFullPath).toFormat('png').toBuffer({
        resolveWithObject: true
    });
    const screenWidth = screenBuffer.info.width;
    const screenHeight = screenBuffer.info.height;
    const deviceKey = `${screenWidth}x${screenHeight}`;
    if (!(deviceKey in frames[os])) {
        throw new Error(`Unknown screenshot for os = ${os} and key = ${deviceKey}`);
    }

    const device = frames[os][deviceKey];
    const ratio = device.innerWidth == screenWidth ? 1 : ((device.innerWidth - screenWidth) / device.innerWidth);
    const deviceInnerWidth = screenWidth;
    const deviceInnerHeight = device.innerHeight * ratio;
    const cornerCutWidth = device.cornerCutWidth * ratio;

    const framePath = `${framesPath}/${os}/${device.name}`;
    const frameCacheKey = `${framePath}-${device.frameWidth * ratio}`;
    if (!(frameCacheKey in frameCache)) {
        frameCache[frameCacheKey] = sharp(framePath).resize(device.frameWidth * ratio).toFormat('png');
    }
    const frameBuffer = await frameCache[frameCacheKey].clone().toBuffer();

    const composites = cornerCutWidth ? [
        getComposite(0, 0, cornerCutWidth, cornerCutWidth),
        getComposite(0, deviceInnerWidth - cornerCutWidth, cornerCutWidth, cornerCutWidth),
        getComposite(deviceInnerHeight - cornerCutWidth, 0, cornerCutWidth, cornerCutWidth),
        getComposite(deviceInnerHeight - cornerCutWidth, deviceInnerWidth - cornerCutWidth, cornerCutWidth, cornerCutWidth)
    ] : [];
    composites.push({
        input: screenBuffer.data,
        blend: 'out'
    });
    
    const image = await sharp({
        create: {
            width: deviceInnerWidth,
            height: deviceInnerHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite(composites).toFormat('png').toBuffer();

    const screenPathParts = path.parse(screenFullPath);

    await sharp({
        create: {
            width: device.frameWidth * ratio,
            height: device.frameHeight * ratio,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite([
        {
            input: image,
            top: device.innerTop * ratio,
            left: device.innerLeft * ratio,
        },
        {
            input: frameBuffer,
        }
    ]).toFile(`${screenPathParts.name}_framed${screenPathParts.ext}`);

    console.log(`Written ${screenPathParts.name}_framed${screenPathParts.ext}`);
}

(async function () {

    if (process.argv.length > 2 && process.argv[2] === 'validate') {
        const messages = [];
        // Validate all frames
        Object.keys(frames).forEach(async function(os) {
            console.log(os);
            Object.keys(frames[os]).forEach(async function(dim) {
                const device = frames[os][dim];
                const path = `${framesPath}/${os}/${device.name}`;
                console.log(path);
                if (!fs.existsSync(path)) {
                    messages.push(`Frame ${path} doesn't exist`);
                    return;
                }
                const buff = await sharp(path).toFormat('png').toBuffer({
                    resolveWithObject: true
                });
                if (buff.info.width != device.frameWidth || buff.info.height != device.frameHeight) {
                    messages.push(`Size of ${path} (${buff.info.width}x${buff.info.height}) is different than the size in the frames.json file ${device.frameWidth}x${device.frameHeight}`);
                    return;
                }
                messages.push(`OK for ${path}`);
            });
        });
        messages.forEach(function(msg) {
            console.error(msg);
        });
        process.exit();
    }

    if (process.argv.length < 4) {
        die('Missing os or path argument');
    }

    const os = process.argv[2];
    if (Object.keys(frames).indexOf(os) === -1) {
        die(`Unknown os ${os}`);
    }

    const screensPath = process.argv[3];
    if (!fs.existsSync(screensPath)) {
        die(`Directory ${screensPath} does not exist`);
    }

    fs.readdirSync(screensPath).filter((value) => path.extname(value) === '.png').forEach(function(screenPath) {
        try {
            frameScreen(path.join(screensPath, screenPath), os);
        } catch (ex) {
            console.error(ex);
        }
    });

    console.log('Finished');

}());

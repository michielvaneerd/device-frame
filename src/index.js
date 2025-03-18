const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const homeDir = require('os').homedir();
const frames = require("./device-frame.json");

function die(message) {
    console.log(message);
    process.exit();
}

function replaceWithHomedir(path) {
    return path.replace('~', homeDir);
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

async function frameScreen(screenFullPath, os, destinationPath) {
    let screenBuffer = await sharp(screenFullPath).toFormat('png').toBuffer({
        resolveWithObject: true
    });

    const screenWidth = screenBuffer.info.width;
    const screenHeight = screenBuffer.info.height;
    const isLandscape = screenWidth > screenHeight;
    // Sizes without portrait / landscape
    const screenAbsoluteWidth = isLandscape ? screenHeight : screenWidth;
    const screenAbsoluteHeight = isLandscape ? screenWidth : screenHeight;

    const deviceKey = `${screenAbsoluteWidth}x${screenAbsoluteHeight}`;
    if (!(deviceKey in frames[os])) {
        throw new Error(`Unknown screenshot for ${screenFullPath} - os = ${os} and key = ${deviceKey}`);
    }

    const device = frames[os][deviceKey];
    const devicePath = replaceWithHomedir(device.path);
    const ratio = device.innerWidth == screenAbsoluteWidth ? 1 : ((device.innerWidth - screenAbsoluteWidth) / device.innerWidth);
    const deviceAbsoluteInnerWidth = isLandscape ? (device.innerHeight * ratio) : (device.innerWidth * ratio);
    const deviceAbsoluteInnerHeight = isLandscape ? (device.innerWidth * ratio) : (device.innerHeight * ratio);
    const deviceAbsoluteFrameHeight = isLandscape ? (device.frameWidth * ratio) : (device.frameHeight * ratio);
    const deviceAbsoluteFrameWidth = isLandscape ? (device.frameHeight * ratio) : (device.frameWidth * ratio);
    const cornerCutSize = device.cornerCutSize * ratio;

    const frameBuffer = await sharp(devicePath).rotate(isLandscape ? -90 : 0).resize(deviceAbsoluteFrameWidth).toFormat('png').toBuffer();

    const composites = cornerCutSize ? [
        getComposite(0, 0, cornerCutSize, cornerCutSize),
        getComposite(0, deviceAbsoluteInnerWidth - cornerCutSize, cornerCutSize, cornerCutSize),
        getComposite(deviceAbsoluteInnerHeight - cornerCutSize, 0, cornerCutSize, cornerCutSize),
        getComposite(deviceAbsoluteInnerHeight - cornerCutSize, deviceAbsoluteInnerWidth - cornerCutSize, cornerCutSize, cornerCutSize)
    ] : [];
    composites.push({
        input: screenBuffer.data,
        blend: 'out'
    });

    const image = await sharp({
        create: {
            width: deviceAbsoluteInnerWidth,
            height: deviceAbsoluteInnerHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite(composites).toFormat('png').toBuffer();

    const screenPathParts = path.parse(screenFullPath);
    const newFile = `${screenPathParts.name}_framed${screenPathParts.ext}`;

    await sharp({
        create: {
            width: deviceAbsoluteFrameWidth,
            height: deviceAbsoluteFrameHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    }).composite([
        {
            input: image,
            top: isLandscape ? ((device.frameWidth - device.innerWidth - device.innerLeft) * ratio) : (device.innerTop * ratio),
            left: isLandscape ? (device.innerTop * ratio) : (device.innerLeft * ratio),
        },
        {
            input: frameBuffer,
        }
    ]).toFile(path.join(destinationPath, newFile));

    console.log(`Written ${screenPathParts.name}_framed${screenPathParts.ext}`);
}

async function validate() {
    const messages = [];
    // Validate all frames
    for (const os in frames) {
        for (const dim in frames[os]) {
            const device = frames[os][dim];
            const devicePath = replaceWithHomedir(device.path);
            if (!fs.existsSync(devicePath)) {
                messages.push(`Frame ${devicePath} doesn't exist`);
                continue;
            }
            const buff = await sharp(devicePath).toFormat('png').toBuffer({
                resolveWithObject: true
            });
            if (dim !== `${device.screenShotWidth}x${device.screenShotHeight}`) {
                messages.push(`Key ${dim} doesn't match defined frameWidth and frameHeight ${device.screenShotWidth}x${device.screenShotHeight}`);
                continue;
            }
            if (buff.info.width != device.frameWidth || buff.info.height != device.frameHeight) {
                messages.push(`Size of ${devicePath} (${buff.info.width}x${buff.info.height}) is different than the size in the device-frame.json file ${device.frameWidth}x${device.frameHeight}`);
                continue;
            }
            messages.push(`OK for ${devicePath}`);
        }
    }
    messages.forEach(function (msg) {
        console.error(msg);
    });
}

(async function () {

    if (process.argv.length > 2 && process.argv[2] === 'validate') {
        await validate();
        process.exit();
    }

    if (process.argv.length < 4) {
        die('Missing os or path argument.');
    }

    // Merge device-frame.json files if needed
    if (fs.existsSync(`${homeDir}/device-frame.json`)) {
        const newFrames = require(`${homeDir}/device-frame.json`);
        for (platform in newFrames) {
            if (!(platform in frames)) {
                frames[platform] = newFrames[platform];
            } else {
                for (size in newFrames[platform]) {
                    frames[platform][size] = newFrames[platform][size];
                }
            }
        }
    }

    const os = process.argv[2];
    if (Object.keys(frames).indexOf(os) === -1) {
        die(`Unknown os ${os}`);
    }

    const screensPath = process.argv[3];
    if (!fs.existsSync(screensPath)) {
        die(`Directory ${screensPath} does not exist.`);
    }

    const destinationPath = process.argv.length >= 5 ? process.argv[4] : '.';
    if (!fs.existsSync(destinationPath)) {
        die(`Destinaton directory ${destinationPath} doesn't exist.`);
    }

    const screens = fs.readdirSync(screensPath).filter((value) => path.extname(value) === '.png');

    for (const screen of screens) {
        try {
            await frameScreen(path.join(screensPath, screen), os, destinationPath);
        } catch (ex) {
            console.error(ex);
        }
    }

    console.log('Finished');

}());

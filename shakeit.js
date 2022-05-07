"use strict";

document.addEventListener("DOMContentLoaded", evt => {
    // Declare variables 
    // Create reference to all relevant elements
    let editor = document.getElementById("editor"),
        display= document.getElementById("display"),
        frameRateSlider = document.getElementById("frameRate"),
        horizontalAmpSlider = document.getElementById("horizontalAmp"),
        verticalAmpSlider = document.getElementById("verticalAmp"),

    // Reference to the source and name of the uploaded image.
        uploadedImageSrc,
        uploadedImageName,

    // Croppie related stuff
        croppie = new Croppie(editor, {
            viewport: {
                width: 250,
                height: 250
            },
            boundary: {
                width: 300,
                height: 300
            },
            enableResize: false,
            enableExif: true,
        });
        croppie.bind({
            url: "assets/upload_message.png",
        }).then(() => {
            croppie.setZoom(0);
        });

    // canvas related stuff
    let displayCtx = display.getContext('2d'),
        animateRequestId,
        imgDisplay = new Image(),

    // jsgif related stuff
        gifEncoder = new GIFEncoder(),
        recording = false,
        framesRecorded = 0,
        totalGIFFrame = 4;

    document.getElementById("uploadedImage").addEventListener('change', () => {
        let fileElem = document.getElementById("uploadedImage");
        // Return if no files selected.
        if (!fileElem.files.length) return;

        let imageFile = fileElem.files[0];
        if (uploadedImageSrc !== undefined) {
            URL.revokeObjectURL(uploadedImageSrc);
        }
        uploadedImageSrc = URL.createObjectURL(imageFile);
        uploadedImageName = imageFile.name.split(".").slice(0, -1).join(".");

        croppie.bind({
            url: uploadedImageSrc,
        });

    }, false);

    document.getElementById("cropBtn").addEventListener('click', evt => {
        // Return immediately unless an image has been uploaded.
        if (uploadedImageSrc === undefined) {
            // TODO: Add a message indicating the absence of an uploaded image.
            return;
        }

        imgDisplay.src = uploadedImageSrc;

        imgDisplay.addEventListener('load', evt => {
            let animateCounter = 0,
                period = totalGIFFrame,
                previousAnimateTimeStamp,

                points = croppie.get().points,
                topLeftX = parseInt(points[0]),
                topLeftY = parseInt(points[1]),
                bottomRightX = parseInt(points[2]),
                bottomRightY = parseInt(points[3]),
                croppedWidth = bottomRightX - topLeftX,
                croppedHeight = bottomRightY - topLeftY;

            function animate(timestamp){
                let frameInterval = 1000.0 / Number(frameRateSlider.value); 
                // Draw a new frame when elapsed time >= frameInterval.
                if (timestamp - previousAnimateTimeStamp >= frameInterval ||
                    previousAnimateTimeStamp === undefined) {
                    let verticalAmp = croppedWidth * Number(verticalAmpSlider.value) / 100.0,
                        horizontalAmp = croppedHeight * Number(horizontalAmpSlider.value) / 100.0,
                        displacementX = Math.cos(animateCounter * 2 * Math.PI / period) * horizontalAmp,
                        displacementY = Math.sin((0.2 + animateCounter) * 2 * Math.PI / period) * verticalAmp,
                        sx,
                        sy;
                    
                    if (displacementX >=0) {
                        sx = Math.min(topLeftX + displacementX, imgDisplay.width - croppedWidth);
                    } else {
                        sx = Math.max(topLeftX + displacementX, 0);
                    }
                    if (displacementY >=0) {
                        sy = Math.min(topLeftY + displacementY, imgDisplay.height - croppedHeight);
                    } else {
                        sy = Math.max(topLeftY + displacementY, 0);
                    }

                    displayCtx.clearRect(0, 0, display.width, display.height); // Clear the canvas before drawing a new frame.
                    displayCtx.drawImage(imgDisplay, sx, sy, croppedWidth, croppedHeight, 0, 0, display.width, display.height);
                    // Add the current frame of the canvas to the encoder if is recording.
                    if (recording) {
                        if (framesRecorded < totalGIFFrame){
                            gifEncoder.addFrame(displayCtx);
                            framesRecorded++;
                        }
                        else {
                            recording = false;
                            framesRecorded = 0;
                            gifEncoder.finish();
                            gifEncoder.download(uploadedImageName + '.gif');
                        }
                    }

                    previousAnimateTimeStamp = timestamp;
                    animateCounter++;
                    if (animateCounter >= 10000) animateCounter = 0;
                }
                animateRequestId = requestAnimationFrame(animate);
            }

            // If an animation's going on, cancel it before starting a new one.
            if (animateRequestId !== undefined) cancelAnimationFrame(animateRequestId);
            animateRequestId = requestAnimationFrame(animate);
        });

        document.getElementById("animationCol").scrollIntoView();
    }, false);

    document.getElementById("saveBtn").addEventListener('click', function(evt) {
        // Return unless an animation's going on.
        if (animateRequestId === undefined) {
            // TODO: Add a message indicating the absence of an animation to be saved.
            return;
        }

        if (!recording) recording = true;

        let frameInterval = 1000.0 / Number(document.getElementById("frameRate").value);
        gifEncoder.setDelay(frameInterval);
        gifEncoder.setRepeat(0);
        gifEncoder.setQuality(1);
        gifEncoder.start();

    }, false);

})
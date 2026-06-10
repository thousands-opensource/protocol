// From https://codepen.io/amazon-ivs/project/editor/ZzWobn
// From https://gitlab.aws.dev/ivs-demos/amazon-ivs-real-time-tool/-/blob/main/src/contexts/DeviceManager/helpers/helpers.ts

import { ClientSideMediaDeviceInfo } from "@/types";
import toast from "react-hot-toast";

let permissions: Permissions, mediaDevices: MediaDevices;

if (typeof window !== "undefined") {
    permissions = navigator.permissions;
    mediaDevices = navigator.mediaDevices;
}

function checkMediaDevicesSupport() {
    if (!mediaDevices) {
        throw new Error(
            "Media device permissions can only be requested in a secure context (i.e. HTTPS)."
        );
    }
}

function isFulfilled(
    input: PromiseSettledResult<any>
): input is PromiseFulfilledResult<any> {
    return input.status === "fulfilled";
}

function isRejected(
    input: PromiseSettledResult<any>
): input is PromiseRejectedResult {
    return input.status === "rejected";
}

async function enumerateDevices(): Promise<{
    videoDevices: ClientSideMediaDeviceInfo[];
    audioDevices: ClientSideMediaDeviceInfo[];
}> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    if (!videoDevices.length) {
        toast.error("Error: Could not find any webcams.", {
            id: "err-could-not-list-video-devices",
            duration: Infinity,
        });
    }

    const audioDevices = devices.filter((d) => d.kind === "audioinput");
    if (!audioDevices.length) {
        toast.error("Error: Could not find any microphones.", {
            id: "err-could-not-list-audio-devices",
            duration: Infinity,
        });
    }

    return {
        videoDevices,
        audioDevices,
    };
}

async function getPermissions({ savedAudioDeviceId, savedVideoDeviceId }: any) {
    let error;
    let mediaStream;
    let arePermissionsGranted = false;

    try {
        checkMediaDevicesSupport();

        const [
            cameraPermissionQueryResult,
            microphonePermissionQueryResult,
        ]: PromiseSettledResult<PermissionStatus>[] = await Promise.allSettled(
            ["camera", "microphone"].map((permissionDescriptorName) =>
                permissions?.query({
                    name: permissionDescriptorName as PermissionName,
                })
            )
        );

        const constraints: any = {};
        // Get permission for video
        if (
            (isFulfilled(cameraPermissionQueryResult) &&
                cameraPermissionQueryResult.value.state !== "granted") ||
            isRejected(cameraPermissionQueryResult)
        ) {
            constraints.video = {
                deviceId: { ideal: savedVideoDeviceId },
            };
        }

        if (
            (isFulfilled(microphonePermissionQueryResult) &&
                microphonePermissionQueryResult.value.state !== "granted") ||
            isRejected(microphonePermissionQueryResult)
        ) {
            constraints.audio = {
                deviceId: { ideal: savedAudioDeviceId },
            };
        }

        if (Object.keys(constraints).length) {
            mediaStream = await mediaDevices.getUserMedia(constraints);
        }

        arePermissionsGranted = true;
    } catch (e: any) {
        console.error("Failed to get permissions", e);
        error = new Error(e.name);
    }

    return { permissions: arePermissionsGranted, mediaStream, error };
}

async function getAvailableDevices({
    savedAudioDeviceId,
    savedVideoDeviceId,
}: any) {
    // The following line prevents issues on Safari/FF WRT to device selects
    // and ensures the device labels are not blank
    const { permissions, mediaStream, error } = await getPermissions({
        savedAudioDeviceId,
        savedVideoDeviceId,
    });

    if (!permissions || error) {
        const msg =
            "Error: Could not access webcams or microphones. Allow this app to access your webcams and microphones and refresh the app.";
        console.error(msg);
        toast.error(msg, {
            id: "err-permission-denied",
            duration: Infinity,
        });
    }

    const { videoDevices, audioDevices } = await enumerateDevices();

    // After enumerating devices, the initial mediaStream must be stopped
    if (mediaStream) await stopMediaStream(mediaStream);

    return {
        videoDevices,
        audioDevices,
        permissions,
    };
}

async function stopMediaStream(mediaStream: { getTracks: () => any }) {
    for (const track of mediaStream.getTracks()) {
        track.stop();
    }
}

async function getCameraStream({
    deviceId,
    width,
    height,
    facingMode,
    frameRate,
    aspectRatio,
}: any) {
    let cameraStream = undefined;
    const constraints: MediaStreamConstraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: {
                ideal: width,
            },
            height: {
                ideal: height,
            },
            facingMode: { ideal: facingMode },
            frameRate: { ideal: frameRate },
            aspectRatio: { ideal: aspectRatio },
        },
        audio: false,
    };
    try {
        const media = await navigator.mediaDevices.getUserMedia(constraints);
        cameraStream = media;
    } catch (e: any) {
        console.error("Could not get camera stream:", e.message);
    }
    return cameraStream;
}

async function getMicrophoneStream(deviceId: string) {
    let microphoneTrack = undefined;
    const contraints: MediaStreamConstraints = {
        video: false,
        audio: { deviceId: { exact: deviceId } },
    };
    try {
        const media = await navigator.mediaDevices.getUserMedia(contraints);
        microphoneTrack = media;
    } catch (e: any) {
        console.error("Could not get microphone stream:", e.message);
    }
    return microphoneTrack;
}

async function getScreenshareStream() {
    let captureStream = undefined;
    const contraints: DisplayMediaStreamOptions = {
        video: {
            // cursor: "always",
            frameRate: 30,
            // resizeMode: "crop-and-scale",
        },
        audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
        },
    };
    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia(
            contraints
        );
    } catch (e: any) {
        throw new Error(e.name);
    }
    return captureStream;
}

function getIdealDevice(deviceId: any, devices: any[]) {
    if (!devices || devices.length === 0) return undefined;
    const deviceExists = devices.reduce(
        (foundDevice: any, currentDevice: { value: any }) =>
            foundDevice || currentDevice.value == deviceId,
        false
    );

    return deviceExists ? deviceId : devices[0].value;
}

function getDisconnectedDevices(oldDeviceArr: any[], newDeviceArr: any[]) {
    return oldDeviceArr.filter(
        (oldDevice: { value: any }) =>
            newDeviceArr.findIndex(
                (newDevice: { value: any }) =>
                    newDevice.value === oldDevice.value
            ) === -1
    );
}

function getConnectedDevices(oldDeviceArr: any[], newDeviceArr: any[]) {
    return newDeviceArr.filter(
        (newDevice: { value: any }) =>
            oldDeviceArr.findIndex(
                (oldDevice: { value: any }) =>
                    oldDevice.value === newDevice.value
            ) === -1
    );
}

export {
    getAvailableDevices,
    getCameraStream,
    getMicrophoneStream,
    getScreenshareStream,
    stopMediaStream,
    getIdealDevice,
    getDisconnectedDevices,
    getConnectedDevices,
};

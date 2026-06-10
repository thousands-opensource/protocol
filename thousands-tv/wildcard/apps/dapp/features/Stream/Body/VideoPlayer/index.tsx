import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import {
    VideoJSQualityPlugin,
    VideoJSIVSTech,
    registerIVSQualityPlugin,
    registerIVSTech,
    VideoJSEvents,
} from "amazon-ivs-player";
import { useStreamContext } from "@/contexts/streamContext";

export type AmazonIVSOptions = {
    stream: string;
};

const VideoPlayer = () => {
    const videoRef = useRef(null);
    const { playbackUrl, toggleToStartPlaying, toggleToStopPlaying } =
        useStreamContext();
    const [awsPlaying, setAwsPlaying] = useState<boolean>(false);

    useEffect(() => {
        const createAbsolutePath = (assetPath: string) =>
            new URL(assetPath, document.URL).toString();

        if (videoRef.current && videojs.getAllPlayers().length == 0) {
            registerIVSTech(videojs, {
                wasmWorker: createAbsolutePath(
                    "/assets/amazon-ivs-wasmworker.min.js"
                ),
                wasmBinary: createAbsolutePath(
                    "/assets/amazon-ivs-wasmworker.min.wasm"
                ),
            });

            registerIVSQualityPlugin(videojs);
            /*
            const videoJSPlayer = videojs("video-js-amazon-IVS", {
                techOrder: ["AmazonIVS"],
                autoplay: true,
                showAllControls: true,
                controlBar: {
                    playToggle: {
                        replay: false
                    }
                },
            }) as typeof Player & VideoJSIVSTech & VideoJSQualityPlugin;

        videoJSPlayer.ready(() => {
            //window.videoJSPlayer = videoJSPlayer;

            const ivsPlayer = videoJSPlayer.getIVSPlayer();

            const videoContainerEl = document.querySelector("#video-js-amazon-IV");
            videoContainerEl?.addEventListener("click", () => {
                if (videoJSPlayer.paused()) {
                    videoContainerEl.classList.remove("vjs-has-started");
                } else {
                    videoContainerEl.classList.add("vjs-has-started");
                }
            });

            const events: VideoJSEvents = videoJSPlayer.getIVSEvents();
            const playerState = events.PlayerState;
            ivsPlayer.addEventListener(playerState.PLAYING, () => {
                setTimeout(() => {
                    console.log("playing");
                    videoJSPlayer.muted(false);
                }, 100);
            });

            videoJSPlayer.enableIVSQualityPlugin();
            videoJSPlayer.volume(1.0);
            //videoJSPlayer.muted(false);
            videoJSPlayer.src(playbackUrl);
            videoJSPlayer.play();
        });
        */

            const Player = videojs.players;
            const player = videojs(
                videoRef.current,
                {
                    techOrder: ["AmazonIVS"],
                    autoplay: true,
                    showallcontrols: true,
                },
                () => {
                    player.enableIVSQualityPlugin();
                    player.src(playbackUrl);
                    player.play();
                }
            ) as typeof Player & VideoJSIVSTech & VideoJSQualityPlugin;

            const events: VideoJSEvents = player.getIVSEvents();
            const ivsPlayer = player.getIVSPlayer();
            ivsPlayer.addEventListener(events.PlayerState.PLAYING, () => {
                // console.log("IVS Player is playing");
                if (!awsPlaying) {
                    setAwsPlaying(true);
                }
            });
            ivsPlayer.addEventListener(events.PlayerState.ENDED, () => {
                // console.log("IVS Player has ended");
            });

            ivsPlayer.addEventListener(
                events.PlayerEventType.ERROR,
                (type: any, source: any) => {
                    // console.log("IVS Player Error:", type, source);
                }
            );
            ivsPlayer.addEventListener(
                events.PlayerEventType.NETWORK_UNAVAILABLE,
                () => {
                    console.log("IVS Player Network Unavailable");
                }
            );
        }
    }, [playbackUrl]);

    useEffect(() => {
        if (videojs.getAllPlayers().length < 1) {
            return;
        }
        const player = videojs.getAllPlayers()[0];

        if (playbackUrl != "") {
            player.src(playbackUrl);
            player.play();
        }
    }, [toggleToStartPlaying]);

    useEffect(() => {
        if (videojs.getAllPlayers().length < 1) {
            return;
        }
        const player = videojs.getAllPlayers()[0];

        //player.hasStarted(false);
        //player.currentTime(0);
        player.pause();
        //player.reset();
        setAwsPlaying(false);
    }, [toggleToStopPlaying]);

    return (
        <div
            data-vjs-player
            style={{
                width: "100%",
                height: "100%",
                minHeight: "220px",
            }}
            className="sm:max-h-[fit-content]"
        >
            <video
                id="video-js-amazon-IVS"
                ref={videoRef}
                className="video-js"
                controls
                playsInline
            />
            {/* Loading Overlay */}
            <div
                style={{
                    backgroundColor: "black",
                    zIndex: 1,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: awsPlaying ? "none" : "block",
                    // backgroundColor: "red",
                    // maxHeight: "calc(50vh - 250px)",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        alignItems: "center",
                    }}
                >
                    <p
                        style={{
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontSize: "32px",
                        }}
                    >
                        Waiting for stream to start...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;

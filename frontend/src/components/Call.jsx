import React, { useEffect, useRef, useState } from "react";

function Call() {
    const [localStream, setLocalStream] = useState(null);
    const constraints = {
        video: {
            width: { min: 640, ideal: 1920, max: 1920 },
            height: { min: 480, ideal: 1080, max: 1080 }
        },
        audio: false
    }

    useEffect(() => {
        offer();
    }, [])

    const offer = async () => {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        document.getElementById("local-video").srcObject = stream;
    }
    console.log(localStream)

    return <video src="" autoPlay playsInline id="local-video"></video>
}

export default Call;
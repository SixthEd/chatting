import React, { useEffect, useRef, useState } from "react";
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import CallIcon from '@mui/icons-material/Call';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import { green } from "@mui/material/colors";
import MicNoneIcon from '@mui/icons-material/MicNone';
import MicOffIcon from '@mui/icons-material/MicOff';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';


function Call(props) {
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const offerRef = useState(null);
    const answerRef = useRef(null);
    const [receiveCall, setReceiveCall] = useState(true);
    const [receiverToggle, setReceiveToggle] = useState(0);
    const [toggle, setToggle] = useState(false);
    
    const MessageType = {
        Offer: 14,
        Answer: 15,
        IceCandidate: 16,
        DisConnectCall: 17
    }
    const constraints = {
        video: true,
        audio: false
    }

        
    useEffect(() => {
        if (props.offer) {
            setReceiveToggle(1)
        }
        else {
            setReceiveToggle(0)
        }
    }, [props.offer])

    let peerConfiguration = {
        iceServers: [
            {
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302'
                ]
            }
        ]
    }
    const fetchUserMedia = async () => {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream

    }

    

    const createPeerConnection = async () => {
        peerConnection.current = new RTCPeerConnection(peerConfiguration);
        remoteStreamRef.current = new MediaStream();
        remoteVideoRef.current.srcObject = remoteStreamRef.current;

        localStreamRef.current.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, localStreamRef.current)
        });

        peerConnection.current.addEventListener("icecandidate", (event) => {
            if (event.candidate) {
                console.log("New Candidates", event.candidate)
                props.ws.send(JSON.stringify({ type: MessageType.IceCandidate, candidate: event.candidate, to: props.selectedUser.id }));
            }
        })


        props.ws.onmessage = async (message) => {
            const parsedMessage = JSON.parse(message.data);
            if (parsedMessage.type === MessageType.IceCandidate) {
                await peerConnection.current.addIceCandidate(parsedMessage.candidate)
            }
            else if (parsedMessage.type === MessageType.Answer) {
                if (peerConnection.current.signalingState === "have-local-offer") {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(parsedMessage.answer))

                }
                setReceiveCall(1);
            }
            else if (parsedMessage.type === MessageType.DisConnectCall) {
                if (peerConnection.current) {
                    peerConnection.current.close();
                    peerConnection.current = null;
                }
                props.setCall(0)
                console.log("disconnected")
            }
        }

        peerConnection.current.addEventListener("track", (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStreamRef.current.addTrack(track, remoteStreamRef.current)
            })
        })

        // if(props.offer)
        // {
        //     await peerConnection.current.setRemoteDescription(props.offer)
        // }

    }

    const receiver = async () => {
        await fetchUserMedia();
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        await createPeerConnection();
        createAnswer();
        setReceiveCall(1);
        // setReceiveToggle(0)
        props.setOffer(null);
    }

    const createAnswer = async () => {
        peerConnection.current.setRemoteDescription(props.offer)
        answerRef.current = await peerConnection.current.createAnswer();
        peerConnection.current.setLocalDescription(answerRef.current);
        props.ws.send(JSON.stringify({ type: MessageType.Answer, answer: answerRef.current, to: props.selectedUser.id }))
        setReceiveToggle(0)
    }

    const createOffer = async () => {
        offerRef.current = await peerConnection.current.createOffer();
        peerConnection.current.setLocalDescription(offerRef.current);
        props.ws.send(JSON.stringify({ type: MessageType.Offer, offer: offerRef.current, to: props.selectedUser.id }))
    }

    const call = async () => {
        await fetchUserMedia();

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        await createPeerConnection();
        await createOffer();
    }

    const cancel = () => {

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        setReceiveToggle(0)
        props.setCall(0)
        props.ws.send(JSON.stringify({ type: MessageType.DisConnectCall, to: props.selectedUser.id }))
    }

    const share = async () => {
        localVideoRef.current.srcObject = null;
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always"
            },
            audio: true
        })
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];

        videoTrack.onended = () => {
            stopSharingAndGoToVideo()
        }

        localStreamRef.current.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, localStreamRef.current)
        });

        const sender = peerConnection.current.getSenders().find(
            (s) => s.track && s.track.kind === "video"
        );

        if (sender) {
            // 🔁 Replace the screen share with webcam video
            sender.replaceTrack(videoTrack);
        } else {
            // For first-time (e.g. if called before any track was sent)
            peerConnection.current.addTrack(videoTrack, stream);
        }

    }


    const stopSharingAndGoToVideo = async () => {
        localVideoRef.current.srcObject = null;
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        })
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];


        localStreamRef.current.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, localStreamRef.current)
        });

        const sender = peerConnection.current.getSenders().find(
            (s) => s.track && s.track.kind === "video"
        );

        if (sender) {
            // 🔁 Replace the webcam video with screen share
            sender.replaceTrack(videoTrack);
        } else {
            // For first-time (e.g. if called before any track was sent)
            peerConnection.current.addTrack(videoTrack, stream);
        }

    }



    return <div id="call-video">
        <div className="calling-buttons">
            {receiveCall === true && <button onClick={() => { call() }}><CallIcon sx={{ fontSize: 40, color: "green" }} /></button>}
            {receiverToggle === 1 && <button onClick={() => { receiver(); }}><CallReceivedIcon sx={{ fontSize: 40, color: "mediumspringgreen" }} /></button>}
            <button onClick={() => { cancel() }}><CallEndIcon sx={{ fontSize: 40, color: "red" }} /></button>
            {receiveCall === 1 && <button onClick={() => { share() }}><ScreenShareIcon sx={{ fontSize: 40, color: "deepskyblue" }} /></button>}
            {receiveCall === 1 && <button onClick={() => { setToggle((prev) => !prev) }}><CameraswitchIcon sx={{ fontSize: 40, color: "deepskyblue" }} /></button>}
        </div>
        <div className="calling-video">
            <video src="" autoPlay playsInline id={toggle === false ? "local-video" : "local-video1"} ref={localVideoRef} ></video>
            <video src="" autoPlay playsInline id={toggle === false ? "remote-video" : "remote-video1"} ref={remoteVideoRef}></video>
        </div>

    </div>
}

export default Call;
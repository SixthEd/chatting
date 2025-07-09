import React, { useEffect, useRef, useState } from "react";
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import CallIcon from '@mui/icons-material/Call';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
// import { green } from "@mui/material/colors";
// import MicNoneIcon from '@mui/icons-material/MicNone';
// import MicOffIcon from '@mui/icons-material/MicOff';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';


function Call(props) {
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const offerRef = useState(null);
    const answerRef = useRef(null);
    // const [receiveCall, setReceiveCall] = useState(true);
    const [receiverToggle, setReceiveToggle] = useState(0);
    const [toggle, setToggle] = useState(false);
    const currentPeerRef = useRef(null);

    useEffect(() => {
        currentPeerRef.current = props.peerConnection;
    }, [props.peerConnection]);


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
        const pc = new RTCPeerConnection(peerConfiguration);
        props.setPeerConnection(pc);

        remoteStreamRef.current = new MediaStream();
        remoteVideoRef.current.srcObject = remoteStreamRef.current;

        // ✅ Attach local tracks
        localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current);
        });

        // ✅ Attach ICE candidate listener
        pc.addEventListener("icecandidate", (event) => {
            if (event.candidate) {
                console.log("New ICE Candidate:", event.candidate);
                props.ws.send(JSON.stringify({
                    type: MessageType.IceCandidate,
                    candidate: event.candidate,
                    to: props.selectedUser.id
                }));
            }
        });


        // ✅ Attach track handler for remote stream
        pc.addEventListener("track", (event) => {
            console.log("Track received from remote peer:", event.streams);
            event.streams[0].getTracks().forEach(track => {
                remoteStreamRef.current.addTrack(track);
            });
        });

        return pc;



    }



    const receiver = async () => {
        await fetchUserMedia();
        if (props.peerConnection) {
            props.peerConnection.close();
            props.setPeerConnection(null);
        }
        const pc = await createPeerConnection();
        createAnswer(pc);
        props.setReceiveCall(1);
        setReceiveToggle(0)
        // props.setOffer(null);
    }

    const createAnswer = async (pc) => {

        if (props.offer) {
            console.log("line 188 props.offer")
        }
        pc.setRemoteDescription(props.offer);
        answerRef.current = await pc.createAnswer();
        pc.setLocalDescription(answerRef.current);
        props.ws.send(JSON.stringify({ type: MessageType.Answer, answer: answerRef.current, to: props.selectedUser.id }))
        setReceiveToggle(0)
    }

    const createOffer = async (pc) => {
        offerRef.current = await pc.createOffer();
        pc.setLocalDescription(offerRef.current);
        props.ws.send(JSON.stringify({ type: MessageType.Offer, offer: offerRef.current, to: props.selectedUser.id , from:  props.user.id}))
    }

    const call = async () => {
        await fetchUserMedia();

        if (props.peerConnection) {
            props.peerConnection.close();
            props.setPeerConnection(null);
        }

        const pc = await createPeerConnection();
        await createOffer(pc);
        props.setCallStatus(1)

    }

    const cancel = () => {

        if (props.peerConnection) {
            props.peerConnection.close();
            props.setPeerConnection(null);
        }
        props.setReceiveCall(0)
        setReceiveToggle(0)
        props.setCallStatus(0)
        props.setCall(0)
        props.setOffer(null)
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
            props.peerConnection.addTrack(track, localStreamRef.current)
        });

        const sender = props.peerConnection.getSenders().find(
            (s) => s.track && s.track.kind === "video"
        );

        if (sender) {
            // 🔁 Replace the screen share with webcam video
            sender.replaceTrack(videoTrack);
        } else {
            // For first-time (e.g. if called before any track was sent)
            props.peerConnection.addTrack(videoTrack, stream);
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
            props.peerConnection.addTrack(track, localStreamRef.current)
        });

        const sender = props.peerConnection.getSenders().find(
            (s) => s.track && s.track.kind === "video"
        );

        if (sender) {
            // 🔁 Replace the webcam video with screen share
            sender.replaceTrack(videoTrack);
        } else {
            // For first-time (e.g. if called before any track was sent)
            props.peerConnection.addTrack(videoTrack, stream);
        }

    }



    return <div id="call-video">
        <div className="calling-to">{props.receiveCall !== 1 && (props.callStatus===0?<p> Call {props.selectedUser.name}?</p>:props.callStatus===1?<p>Calling {props.selectedUser.name}</p>:<p>{props.callingMessage}</p>)}</div>

        <div className="calling-buttons">
            {props.receiveCall !== 1 && <button onClick={() => { call() }}><CallIcon sx={{ fontSize: 40, color: "green" }} /></button>}
            {receiverToggle === 1 && <button onClick={() => { receiver(); }}><CallReceivedIcon sx={{ fontSize: 40, color: "mediumspringgreen" }} /></button>}
            <button onClick={() => { cancel() }}><CallEndIcon sx={{ fontSize: 40, color: "red" }} /></button>
            {props.receiveCall === 1 && <button onClick={() => { share() }}><ScreenShareIcon sx={{ fontSize: 40, color: "deepskyblue" }} /></button>}
            {props.receiveCall === 1 && <button onClick={() => { setToggle((prev) => !prev) }}><CameraswitchIcon sx={{ fontSize: 40, color: "deepskyblue" }} /></button>}
        </div>
        <div className="calling-video">
            <video src="" autoPlay playsInline id={toggle === false ? "local-video" : "local-video1"} ref={localVideoRef} ></video>
            <video src="" autoPlay playsInline id={toggle === false ? "remote-video" : "remote-video1"} ref={remoteVideoRef}></video>
        </div>

    </div>
}

export default Call;
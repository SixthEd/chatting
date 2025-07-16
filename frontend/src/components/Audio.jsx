import React, { useState, useEffect, useCallback, useRef } from "react";
import AudioFileRoundedIcon from '@mui/icons-material/AudioFileRounded';
// import { withTheme } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import SendSharpIcon from '@mui/icons-material/SendSharp';
function Audio(props) {
    const [audio, setAudio] = useState(null);
    const [audioURL, setAudioURL] = useState("");
    const [caption, setCaption] = useState("");
    const inputRef = useRef(null);

    const updateAudioName = useCallback((event) => {
        setAudio(event.target.files[0])
        console.log(event.target.files[0].name)

    }, [])

    useEffect(() => {
        if (audio) {
            const url = URL.createObjectURL(audio);
            setAudioURL(url);
            // Cleanup the object URL when the component unmounts or when the audio changes
            return () => URL.revokeObjectURL(url);
        }
    }, [audio]);

    const handleRef = useCallback(() => {
        inputRef.current.click();
    }, []);

    const closing = useCallback(() => {
        props.updateAudio();
    },[props])

    const sendAudioCaption = useCallback(() => {
        if (audioURL) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                // console.log(reader.result);
                const src = reader.result;
                const obj = {
                    audio: src,
                    caption: caption,
                    type: "audioCaption",
                }
                if (audioURL) {
                    props.sendMess(obj);
                    closing();
                }
            })
            reader.readAsDataURL(audio);
        }


    },[audio, audioURL, caption, closing, props])

    return <div className="file-form" >
        <button className="file-close" onClick={() => closing()} ><CloseIcon /></button>
        <form action="">
            <div onClick={handleRef}>
                {audioURL ? <audio src={audioURL} controls ></audio> : <AudioFileRoundedIcon sx={{ fontSize: 400, color: "white" }} />}
                <input type="file" accept="audio/*" onChange={updateAudioName} style={{ display: "none" }} ref={inputRef} />
            </div>
            <div className="file-caption">
                <input type="text" name="caption" onChange={(event) => { setCaption(event.target.value) }} value={caption} placeholder="Add caption" />
                <button onClick={(event) => { event.preventDefault(); sendAudioCaption(); }}><SendSharpIcon /></button>
            </div>
        </form>
    </div>
}

export default Audio;
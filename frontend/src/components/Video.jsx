import React, { useState, useEffect, useCallback, useRef } from "react";
import VideoFileIcon from '@mui/icons-material/VideoFile';
import { withTheme } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import SendSharpIcon from '@mui/icons-material/SendSharp';
function Video(props) {
    const [video, setVideo] = useState(null);
    const [videoURL, setVideoURL] = useState("");
    const [caption, setCaption] = useState("");
    const inputRef = useRef(null);

    const updateVideoName = useCallback((event) => {
        setVideo(event.target.files[0])
        console.log(event.target.files[0].name)

    }, [])

    useEffect(() => {
        if (video) {
            const url = URL.createObjectURL(video);
            setVideoURL(url);
            // Cleanup the object URL when the component unmounts or when the video changes
            return () => URL.revokeObjectURL(url);
        }
    }, [video]);

    const handleRef = useCallback(() => {
        inputRef.current.click();
    }, []);

    const closing = useCallback(() => {
        props.updateVideo();
    })

    const sendVideoCaption = useCallback(() => {
        if (videoURL) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                // console.log(reader.result);
                const src = reader.result;
                const obj = {
                    video: src,
                    caption: caption,
                    type: "vCaption"
                }
                if (videoURL) {
                    props.sendMess(obj);
                    closing();
                }
            })
            reader.readAsDataURL(video);
        }


    })

    return <div className="file-form" >
        <button className="file-close" onClick={() => closing()} ><CloseIcon /></button>
        <form action="">
            <div onClick={handleRef}>
                {videoURL ? <video src={videoURL} controls width="400" height="400" autoplay loop muted preload="auto"></video> : <VideoFileIcon sx={{ fontSize: 400, color: "white" }} />}
                <input type="file" accept="video/*" onChange={updateVideoName} style={{ display: "none" }} ref={inputRef} />
            </div>
            <div className="file-caption">
                <input type="text" name="caption" onChange={(event) => { setCaption(event.target.value) }} value={caption} placeholder="Add caption" />
                <button onClick={(event) => { event.preventDefault(); sendVideoCaption(); }}><SendSharpIcon /></button>
            </div>
        </form>
    </div>
}

export default Video;
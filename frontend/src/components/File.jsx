import React, { useState, useEffect, useCallback, useRef } from "react";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
// import { withTheme } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import SendSharpIcon from '@mui/icons-material/SendSharp';


function File(props) {
    const [image, setImage] = useState(null);
    const [imageURL, setImageURL] = useState("");
    const [caption, setCaption] = useState("");
    const inputRef = useRef(null);

    const updateImageName = useCallback((event) => {
        setImage(event.target.files[0])
        console.log(event.target.files[0].name)

    }, [])

    useEffect(() => {
        if (image) {
            const url = URL.createObjectURL(image);
            setImageURL(url);
            // Cleanup the object URL when the component unmounts or when the image changes
            return () => URL.revokeObjectURL(url);
        }
    }, [image]);

    const handleRef = useCallback(() => {
        inputRef.current.click();
    }, []);

    const closing = useCallback(() => {
        props.updateFile();
    },[props])

    const sendImageCaption = useCallback(() => {
        if (imageURL) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                // console.log(reader.result);
                const src = reader.result;
                const obj = {
                    image: src,
                    caption: caption,
                    type: "imgCaption"
                }
                if (imageURL) {
                    props.sendMess(obj);
                    closing();
                }
            })
            reader.readAsDataURL(image);

        }

    },[caption, closing, image, imageURL, props])

    return <div className="file-form" >
        <button className="file-close" onClick={() => closing()} ><CloseIcon /></button>
        <form action="">
            <div onClick={handleRef}>
                {imageURL ? <img src={imageURL} alt=""></img> : <AddPhotoAlternateIcon sx={{ fontSize: 400, color: "white" }} />}
                <input type="file" accept="image/*" onChange={updateImageName} style={{ display: "none" }} ref={inputRef} />
            </div>
            <div className="file-caption">
                <input type="text" name="caption" onChange={(event) => { setCaption(event.target.value) }} value={caption} placeholder="Add caption" />
                <button onClick={(event) => { event.preventDefault(); sendImageCaption(); }}><SendSharpIcon /></button>
            </div>
        </form>
    </div>
}

export default File;
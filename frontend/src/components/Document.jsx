import React, { useState, useEffect, useCallback, useRef } from "react";
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { withTheme } from "@emotion/react";
import CloseIcon from '@mui/icons-material/Close';
import SendSharpIcon from '@mui/icons-material/SendSharp';
function Document(props) {
    const [document, setDocument] = useState(null);
    const [documentURL, setDocumentURL] = useState("");
    const [caption, setCaption] = useState("");
    const inputRef = useRef(null);

    const updateDocumentName = useCallback((event) => {
        setDocument(event.target.files[0])
        console.log(event.target.files[0])

    }, [])

    useEffect(() => {
        if (document) {
            const url = URL.createObjectURL(document);
            setDocumentURL(url);
            // Cleanup the object URL when the component unmounts or when the Document changes
            return () => URL.revokeObjectURL(url);
        }
    }, [document]);

    const handleRef = useCallback(() => {
        inputRef.current.click();
    }, []);

    const closing = useCallback(() => {
        props.updateDocument();
    })

    const sendDocumentCaption = useCallback(() => {
        if (documentURL) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                // console.log(reader.result);
                const src = reader.result;
                const obj = {
                    document: src,
                    caption: caption,
                    type: "documentCaption",
                    name: document.name,
                }
                if (documentURL) {
                    props.sendMess(obj);
                    closing();
                }
            })
            reader.readAsDataURL(document);
        }


    })

    return <div className="file-form" >
        <button className="file-close" onClick={() => closing()} ><CloseIcon /></button>
        <form action="">
            <div onClick={handleRef}>
                {documentURL ? <div className="doc-name">{document.name}</div>: <UploadFileRoundedIcon sx={{ fontSize: 400, color: "white" }}/> }
                <input type="file" accept=".doc,.docx,.pdf,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={updateDocumentName} style={{ display: "none" }} ref={inputRef} />
            </div>
            <div className="file-caption">
                <input type="text" name="caption" onChange={(event) => { setCaption(event.target.value) }} value={caption} placeholder="Add caption" />
                <button onClick={(event) => { event.preventDefault(); sendDocumentCaption(); }}><SendSharpIcon /></button>
            </div>
        </form>
    </div>
}

export default Document;
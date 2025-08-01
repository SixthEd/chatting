import React, { useContext, useEffect, useState } from "react";
import { useRef } from "react";
import { AuthContext } from "./AuthContext";
import DrawIcon from '@mui/icons-material/Draw';
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import SquareIcon from '@mui/icons-material/Square';

export const Canvas = (props) => {

    const canvasRef = useRef(null);
    const { classRoomPassword } = useContext(AuthContext)
    const [isDrawing, setIsDrawing] = useState(0)
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })
    const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
    const roomMessageType = { Drawing: 14 }
    const paintingColors = [
        "Red",
        "Orange",
        "Yellow",
        "Green",
        "Blue",
        "Indigo",
        "Violet",
        "Black",
        "White",
        "Gray",
        "Brown",
        "Pink",
        "Cyan",
        "Gold",
        "Purple",
        "Lime",
        "Firebrick",
        "Steelblue",
        "Wheat",
        "Tan"
    ];

    const [color, setColor] = useState()
    const [isPress, setIsPress] = useState(false)

    useEffect(() => {
        // setLastPosition({ x: props.lastPosition.x, y: props.lastPosition.y });
        // setCurrentPosition({ x: props.currentPosition.x, y: props.currentPosition.y })
        pixelPosition(props.pixel)
        // setIsDrawing(0)
    }, [props.pixel])

    const position = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        return { x, y }
    }


    const pixelPosition = (pixel) => {
        console.log(pixel.isDrawing)

        // setIsPress(true);
        if (pixel.isDrawing === 1) {
            const canvas = canvasRef.current;
            var ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.moveTo(pixel.lastPosition.x, pixel.lastPosition.y);
            ctx.lineTo(pixel.currentPosition.x, pixel.currentPosition.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = pixel.color
            ctx.stroke();
        }
        else if (pixel.isDrawing === 2) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(pixel.x, pixel.y, 20, 20)
        }
        // setIsDrawing(0)
        // setIsPress(0)
    }

    const mousePress = (event) => {
        const { x, y } = position(event);
        setIsPress(true)
        setCurrentPosition({ x, y })
        setLastPosition({ x, y })

    }

    const mouseUp = (event) => {
        // const { x, y } = position(event);
        setIsPress(false);
    }

    const mouseOut = (event) => {
        setLastPosition({ x: 0, y: 0 });
        setIsPress(false);
    }

    const moving = (event) => {
        setCurrentPosition(position(event))
        if (!isDrawing) {
            return
        }
        else if (isDrawing === 1 && isPress) {
            const canvas = canvasRef.current;
            // const { x, y } = position(event);
            var ctx = canvas.getContext("2d");
            ctx.beginPath();
            props.sendCanvas({ type: roomMessageType.Drawing, isDrawing, color, lastPosition, currentPosition, password: classRoomPassword })
            ctx.moveTo(lastPosition.x, lastPosition.y);
            ctx.lineTo(currentPosition.x, currentPosition.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = color
            ctx.stroke();
            setLastPosition({ x: currentPosition.x, y: currentPosition.y })
        }
        else if (isDrawing === 2 && isPress) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            const { x, y } = position(event)
            props.sendCanvas({ type: roomMessageType.Drawing, isDrawing, x, y, password: classRoomPassword })

            ctx.clearRect(x, y, 20, 20)
        }
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        // const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, 1200, 760)
    }

    useEffect(() => {
        props.setExposeFunction(() => clearCanvas())
    }, [props])


    return <div className="canvas-board-container">
        <div className="canvas-board">
            <div className="colors-board">
                <div className="pencil-board">
                    <button onClick={(e) => { setIsDrawing(2); }} ><AutoFixNormalIcon />Eraser</button>
                    <button onClick={(e) => { setIsDrawing(1); }}><DrawIcon /> Pencil</button>
                    <button onClick={() => { clearCanvas(); props.sendClearDraw() }}><SquareIcon />New</button>
                    {/* <button onClick={(e)=>{ clearBoard()}}></button> */}
                </div>
                <div className="painting-colors">
                    {paintingColors.map((c, i) => <button style={{ backgroundColor: c }} key={i} onClick={() => { setColor(c); setIsDrawing(1) }}></button>)}
                </div>
            </div>

            <div id="canvas-container">
                <canvas width={1200} height={760} ref={canvasRef} onMouseDown={(e) => mousePress(e)} onMouseMove={(e) => moving(e)} onMouseUp={(e) => mouseUp(e)} onMouseLeave={(e) => { mouseOut(e) }}></canvas>

            </div>

        </div>
    </div>
}

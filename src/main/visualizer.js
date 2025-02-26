let canvas = document.getElementById("visualizer")
let MouseDebugDiv = document.querySelector(".mouse-tools")
let MouseX = document.getElementById("MouseX")
let MouseY = document.getElementById("MouseY")
let MouseR = document.getElementById("MouseR")
let MouseG = document.getElementById("MouseG")
let MouseB = document.getElementById("MouseB")
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d")
ctx.lineWidth = 4;
let fillMode = false
let LineColor =[47,212,227]
let FillColor=[47,212,227]
let pattern
let ImgReady=false
let RecentUUID
function hexToRGB(hex)
{
    hex=hex.replace("#","")
    const R=parseInt(hex.slice(0,2),16)
    const G=parseInt(hex.slice(2,4),16)
    const B=parseInt(hex.slice(4,6),16)
    return [R,G,B]
}
function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (
        (2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
}
function drawVisualizer(frequencyData) {
    // // Clear the canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // for(let lineOffset=0;lineOffset<2;lineOffset++)
    // {
    //     ctx.beginPath();
    //     ctx.strokeStyle=(lineOffset==0)?"lime":"red";
    //     // Loop through frequency data and create points
    //     for (let i = 0; i < frequencyData.length - 1; i++) {
    //         const p0 = i > 0 ? frequencyData[i - 1] : frequencyData[i]; // Previous point
    //         const p1 = frequencyData[i]; // Current point
    //         const p2 = frequencyData[i + 1]; // Next point
    //         const p3 = i < frequencyData.length - 2 ? frequencyData[i + 2] : frequencyData[i + 1]; // Next-next point
    //         // Draw a Catmull-Rom curve between points
    //         for (let t = 0; t <= 1; t += 0.1) {
    //             let x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
    //             let y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);

    //             if (t === 0 && i === 0) {
    //                 ctx.moveTo(x, (lineOffset==0)?y:canvas.height-y); // Start point
    //             } else {
    //                 ctx.lineTo(x,(lineOffset==0)?y:canvas.height-y); // Continue the line
    //             }
    //         }
    //     }
    //     ctx.stroke(); // Draw the spline for this layer
    // }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let lineOffset = 1; lineOffset < 4; lineOffset++) {
        ctx.beginPath();
        ctx.strokeStyle = (lineOffset === 0) ? "lime" : (lineOffset === 1) ? "red" : (lineOffset === 2) ? "blue" : "yellow"; // Different colors for each side
        // Loop through frequency data and create points
        let GX,GY
        for (let i = 0; i < frequencyData.length - 1; i++) {
            const p0 = i > 0 ? frequencyData[i - 1] : frequencyData[i]; // Previous point
            const p1 = frequencyData[i]; // Current point
            const p2 = frequencyData[i + 1]; // Next point
            const p3 = i < frequencyData.length - 2 ? frequencyData[i + 2] : frequencyData[i + 1]; // Next-next point
            // Draw a Catmull-Rom curve between points
            for (let t = 0; t <= 1; t += 0.1) {
                let x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
                let y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
                let WidthScaler,HeightScaler
                switch (lineOffset) {
                    case 1:
                        // TOP line
                        if (t === 0 && i === 0) {
                            ctx.moveTo(x, canvas.height - y); // Start point
                        } else {
                            ctx.lineTo(x, canvas.height - y); // Continue the line
                        }
                        GX=canvas.width/2
                        GY=canvas.height
                        break;
                    case 2:
                        // Left line: Flip x and keep y
                        WidthScaler=2.29
                        HeightScaler=2.25
                        if (t === 0 && i === 0) {
                            ctx.moveTo(canvas.width/WidthScaler+y, x-canvas.height/HeightScaler);
                            // ctx.moveTo(x-canvas.height/2, canvas.width-y);
                        } else {
                            ctx.lineTo(canvas.width/WidthScaler+y, x-canvas.height/HeightScaler); // Continue the line
                        }
                        GX=0
                        GY=canvas.height/2
                        break;
                    case 3:
                        // Right line: Flip x and keep y
                        WidthScaler=1.775
                        HeightScaler=2.25
                        if (t === 0 && i === 0) {
                            ctx.moveTo(canvas.width/WidthScaler-y, x-canvas.height/HeightScaler); // Start point
                        } else {
                            ctx.lineTo(canvas.width/WidthScaler-y, x-canvas.height/HeightScaler); // Continue the line
                        }
                        GX=canvas.width
                        GY=-(canvas.height/2)
                        break;
                }
            }
        }
        if(fillMode){
            try {
                const Gradient = ctx.createLinearGradient(canvas.width/2,canvas.height/2, GX,-GY)
                Gradient.addColorStop(0,`rgba(${FillColor[0]},${FillColor[1]},${FillColor[2]},0.65)`)
                Gradient.addColorStop(0.25,`rgba(${FillColor[0]},${FillColor[1]},${FillColor[2]},.56`)
                Gradient.addColorStop(.37,`rgba(${FillColor[0]},${FillColor[1]},${FillColor[2]},0)`)
                if(ImgReady){
                    ctx.fillStyle=pattern
                }else{
                    ctx.fillStyle=Gradient
                }
                ctx.closePath()
                ctx.fill()
                ctx.strokeStyle =`rgba(${LineColor[0]},${LineColor[1]},${LineColor[2]},1)`
                ctx.stroke()
            } catch (error) {
                
            }
        }else{
            ctx.strokeStyle =`rgba(${LineColor[0]},${LineColor[1]},${LineColor[2]},1)`
            ctx.stroke(); 
        }
    }
}


window.electronAPI.SignalToRenderer("inbound-frequency",(Data,UUID)=>{
    //console.log("Data: ",Data);
    //console.log("UUID: ",UUID);
    console.log("Inbound UUID: ",UUID)
    console.log("Inbound RecentUUID: ",RecentUUID)
    if(UUID!=RecentUUID)return;
    const Points = Data.map((value,index)=>({
        x:index*(canvas.width / Data.length),
        y:canvas.height-value
    }))
    drawVisualizer(Points)
})
window.electronAPI.SignalToRenderer("inbound-settings",(Data,UUID)=>{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fillMode=Data.bFillVisualizer
    RecentUUID=UUID
    console.log("UUID: ",UUID)
    console.log("RecentUUID: ",RecentUUID)
    LineColor=hexToRGB(Data.VisualizerLineColor)
    FillColor=hexToRGB(Data.VisualizerFillColor)
    if(!Data.VisualizerFillPatternPath){
        pattern=undefined
        ImgReady=false
    }else{
        const img = new Image()
        img.src=Data.VisualizerFillPatternPath
        img.onload=()=>{
            pattern = ctx.createPattern(img,"repeat")
            ImgReady=true
        }
    }
})
window.electronAPI.SignalToRenderer("stop-visualizer",()=>{
    ctx.clearRect(0, 0, canvas.width, canvas.height);  
})
window.electronAPI.SignalToRenderer("ToggleMouseDebugTools",(value)=>{
    (value)?MouseDebugDiv.style.display="inline-block":MouseDebugDiv.style.display="none";
})
window.electronAPI.SignalToRenderer("MouseDetails",(Data)=>{
    MouseX.innerText=Data.Pos.x
    MouseY.innerText=Data.Pos.y
    if(typeof Data.Color == "string"){
        MouseR.innerText="N/A"
        MouseG.innerText="N/A"
        MouseB.innerText="N/A"
    }else{
        MouseR.innerText=Data.Color[0]
        MouseG.innerText=Data.Color[1]
        MouseB.innerText=Data.Color[2]
    }
})
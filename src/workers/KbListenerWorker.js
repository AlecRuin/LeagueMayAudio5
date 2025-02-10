const {parentPort} = require("worker_threads")
const {GlobalKeyboardListener} = require("node-global-key-listener")
let kbListener = new GlobalKeyboardListener({windows:{onError:(err)=>console.log(err)}})

kbListener.addListener((e,down)=>{
    if(e.state=="UP")return;
    if (!["SQUARE BRACKET OPEN", "SQUARE BRACKET CLOSE", "BACKSLASH"].includes(e.name)) return;
    if(e.state=="DOWN"&&e.name=="SQUARE BRACKET OPEN"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
    //   if(mainWindow.isFocused())return;
    //   console.log("Start playing");
    //   if(MasterScript.scanningThread)return;
        parentPort.postMessage({command:"play",data:false})
    }else if(e.state=="DOWN"&&e.name=="SQUARE BRACKET CLOSE"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
    //   if(mainWindow.isFocused())return;
    //   if(!MasterScript.scanningThread)return;
    //   console.log("Stop playing");
        parentPort.postMessage({command:"stop"})
    }else if(e.state=="DOWN"&&e.name=="BACKSLASH"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
    //   if(mainWindow.isFocused())return;
        parentPort.postMessage({command:"play",data:true})
    }
})
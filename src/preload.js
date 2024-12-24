// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge,ipcRenderer} = require("electron/renderer")
contextBridge.exposeInMainWorld("electronAPI",{
    ChangeDisplay:(DisplayNum)=>{ipcRenderer.send("ChangeDisplay",DisplayNum)},


    SignalToMain:(channel,...args)=>{ipcRenderer.send(channel,...args)},
    InvokeRendererToMain:(channel,...args)=>ipcRenderer.invoke(channel,...args),
    SignalToRenderer:async(channel,callback)=>{ipcRenderer.on(channel,(e,...args)=>{callback(...args)})}
})
const {app, BrowserWindow,Menu,ipcMain,screen, dialog, desktopCapturer } = require("electron");
const windowStateKeeper = require("electron-window-state");
const path = require("node:path")
const robot = require("robotjs")
const Speaker = require("speaker")
const {Lame} = require("node-lame")
const AudioContext = require("node-web-audio-api").AudioContext
const fs = require("fs")
const {getBuffer,AsyncTween,Script,Block,Track} = require("./audioHandler");
let mainWindow,source,MasterScript
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let errorTitles=[
  "schum.",
  "fool",
  "You're wasting my time",
  "Thats that",
  "Impossible",
  "Don't move",
  "You'd think to make a fool of me?",
  "Ashes to ashes"
]
let GetLeagueDirSave,SetLeagueDirSave,GetSavedScript,SetSavedScript,DeleteAllData
async function loadModules(){
  let module = await import("./electronstore.mjs")
  GetLeagueDirSave=module.GetLeagueDirSave;
  SetLeagueDirSave = module.SetLeagueDirSave;
  GetSavedScript = module.GetSavedScript;
  SetSavedScript = module.SetSavedScript;
  DeleteAllData=module.DeleteAllData;
}
loadModules().then(()=>{
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
  const createWindow = () => {
    // Create the browser window.
    const {width,height}= screen.getPrimaryDisplay().workAreaSize
    let mainWindowState = windowStateKeeper({
      defaultHeight:Math.floor(height*0.4),
      defaultWidth:Math.floor(width*0.4)
    })
    const mainmenu = Menu.buildFromTemplate([
      {
       label:"File",
       submenu:[
        {
          label:"Delete saved settings",click:()=>{DeleteAllData()}
        },
        {
          label:"Exit",click:()=>{mainWindowState.saveState(); app.exit()}
        }
       ] 
      }
    ])
  
    mainWindow = new BrowserWindow({
      width: mainWindowState.width,
      height: mainWindowState.height,
      x:mainWindowState.x,
      y:mainWindowState.y,
      icon:path.join(__dirname,"./assets/neroicon.ico"),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });
    mainWindow.setMenu(mainmenu);
    mainWindowState.manage(mainWindow);
    if(mainWindowState.isMaximized)mainWindow.maximize();
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'main/index.html'));
  
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  
    mainWindow.on("close",(e)=>{
      mainWindowState.saveState()
      if (source!=null)
      {
        source.stop();
        source.disconnect()
        source=null
      } 
      app.quit();
    })
  };
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();
  
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  
    function updateDisplayCount(...args)
    {
      mainWindow.send("UpdateDisplaySelection",screen.getAllDisplays())
    }
    screen.on("display-added",updateDisplayCount)
    screen.on('display-added',updateDisplayCount);
    screen.on('display-removed', updateDisplayCount);
  
    ipcMain.on("ChangeDisplay",(e,DisplayNum)=>{
      MasterScript.changeSelectedScreen(DisplayNum)
    })
    ipcMain.on("ChangeHeartbeat",(e,value)=>{
      (value>=1)?MasterScript.heartbeat = value:MasterScript.heartbeat=1;
      SetSavedScript(MasterScript.toJSON())
      mainWindow.send("UpdateHeartbeat",(value>=1)?value:1)
    })
    ipcMain.on("ChangeValue",(e,index,channel,value)=>{
      MasterScript.Blocks[index][channel]=value
      SetSavedScript(MasterScript.toJSON())
    })
    ipcMain.handle("OpenDirDialog",async()=>{
      const result = await dialog.showOpenDialog({
        properties:["openDirectory"],
        defaultPath:(GetLeagueDirSave())?GetLeagueDirSave():"C:\\Program Files\\Riot Games\\League of Legends"
      })
      if (!fs.existsSync(path.join(result.filePaths[0],"Config","PersistedSettings.json"))) {
        dialog.showMessageBox(null,{
          message: "The directory selected doesn't have \"PersistedSettings.json\" in \"config\" folder. Try selecting a valid League of Legends installation folder.",
          title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
          icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
        })
        return
      }
      SetLeagueDirSave(result.filePaths[0])
      MasterScript.changeLeagueDir(result.filePaths[0])
      return result.filePaths[0]
    })
    ipcMain.handle("CreatePriority",()=>{
      let newBlock = new Block()
      MasterScript.addBlock(newBlock)
      SetSavedScript(MasterScript.toJSON())
      return MasterScript.Blocks.length
    })
    ipcMain.handle("RemovePriority",(index)=>{
      MasterScript.removeBlock(index)
      SetSavedScript(MasterScript.toJSON())
      return MasterScript.Blocks.length
    })
   
    ipcMain.handle("GetNumOfPriorities",()=>{
      if (MasterScript.Block)return MasterScript.Block.length
      return 0
    })
    mainWindow.send("UpdateDisplaySelection",screen.getAllDisplays())
    
    MasterScript = new Script()
    
    let Data = GetSavedScript()
    MasterScript.parseJSON(Data)
    mainWindow.send("UpdateAll",Data)
    console.log("Master script: ",MasterScript);
    
    // Connect to the X server
    
    // console.log(path.join(__dirname,"./Devil Trigger Start.wav"));
    // const audioContext = new AudioContext()
    // async function Play()
    // {
    //   try {
    //   // const speaker = new Speaker({
    //   //   channels:2,
    //   //   bitDepth:24,
    //   //   sampleRate:48000
    //   // })//
      
    //   let audioBuffer = await getBuffer(audioContext,"./Despair.mp3")

    //   source = audioContext.createBufferSource();
    //   source.buffer = audioBuffer 
    //   const gainNode = audioContext.createGain()
    //   gainNode.gain.value=1.0
    //   source.connect(gainNode)
    //   gainNode.connect(audioContext.destination)
    //   source.start()
    //   // setTimeout(()=>{
    //   //   gainNode.gain.value=0.1
    //   // },1000)

    //   source.onended = ()=>{
    //     console.log("song ended?");
    //     if(source)source.disconnect()
    //   }

    //   AsyncTween(gainNode,1,0,3000)
    //   console.log("working");
      
    //   // setTimeout(()=>{
    //   //   source.stop()
    //   //   //stops the song
    //   // },3000)
    //   } catch (error) {
    //     console.log("error: ",error)
    //   }
    // }
    
    //Play()
  })
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.

})
const {app, BrowserWindow,Menu,ipcMain,screen, dialog, desktopCapturer,shell } = require("electron");
app.setName("League May Audio 5")
const windowStateKeeper = require("electron-window-state");
const path = require("node:path")
const robot = require("robotjs")
//const pixelmatch = require("pixelmatch")
const fs = require("fs")
require("dotenv").config()
const {Script,Block,Track,ScanningAbilityBorderLocations,generateUUID,hexToRGB} = require("./audioHandler");
const {ClearFile,Log,SetDir,SetWindow, WriteStream, SetVerbosity, serializeToString} = require("./logging.js")
const {Worker}= require("worker_threads")
const axios = require("axios")
const {jwtDecode} = require("jwt-decode")
SetDir(app.getPath("userData"))
const { machineIdSync } = require('node-machine-id');
let mainWindow,MasterScript,overlayWindow,Play,Stop,popupWindow
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let errorTitles=[
  "Schum.",
  "Fool",
  "You're wasting my time",
  "That's that",
  "Impossible",
  "Don't move",
  "You'd think to make a fool of me?",
  "Ashes to ashes",
  "Rest in peace",
  "How boring",
  "Where's your motivation?",
  "You're going down",
  "Don't get so cocky",
  "You TRASH!",
  "This is the end!",
  "Is that all?",
  "Disappointing.",
  "Tch...how droll",
  "Pathetic",
  "You mock me!?",
]
let GetLeagueDirSave,SetLeagueDirSave,GetSavedScript,SetSavedScript,DeleteAllData,dialogBox,
saveLocation,GetLoggingState,SetLoggingState,Pixelmatch,bIsVerboseLogging,checkLicenseAndUpdate,
GetLicenseKey,SetLicenseKey,GetVerified,SetVerified,SetJWT,GetJWT;
async function loadModules(){
  let module = await import("./electronstore.mjs")
  let module2 = await import("./pixelmatcher.mjs")
  GetLeagueDirSave=module.GetLeagueDirSave;
  SetLeagueDirSave = module.SetLeagueDirSave;
  GetSavedScript = module.GetSavedScript;
  SetSavedScript = module.SetSavedScript;
  DeleteAllData=module.DeleteAllData;
  GetLoggingState=module.GetLoggingState
  SetLoggingState=module.SetLoggingState
  GetLicenseKey=module.GetLicenseKey
  SetLicenseKey=module.SetLicenseKey
  SetJWT = module.SetJWT
  GetJWT = module.GetJWT
  Pixelmatch=module2.Pixelmatch
}
async function Open()
{
  try {
    if(dialogBox)throw new Error("dialog box is in use");
    dialogBox = dialog.showOpenDialog({
      filters:[{name:"JSON",extensions:["json"]}],
      properties:["openFile"],
    })
    const result = await dialogBox
    if(!result.canceled){
      dialogBox=undefined
      mainWindow.send("UpdateAll")
      const jsonData = fs.readFileSync(result.filePaths[0], "utf-8");
      const data = JSON.parse(jsonData);
      Log(new Error(),"parsed data from file: ",data);
      MasterScript=new Script(undefined,screen.getPrimaryDisplay(),Pixelmatch)
      MasterScript.parseJSON(data)
      mainWindow.send("UpdateAll",MasterScript)
    }
    dialogBox=undefined
  } catch (error) {
    Log(new Error(),error)
    console.error(error);
    if(error.message!="dialog box is in use"){
      if(dialogBox){
        Log(new Error(),"dialog box is in use")
        console.error("dialog box is in use");
      }else{
        dialogBox = dialog.showMessageBox(null,{
          message: "There was problem reading the .JSON file. Contact Valentine",
          title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
          icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
        })
        const result = await dialogBox
        if(result)dialogBox=undefined;
      }
    }
  }
}
async function SaveAs()
{
  try {
    if(dialogBox)throw new Error("dialog box is in use");
    dialogBox = dialog.showSaveDialog({
      filters:[{name:"JSON",extensions:["json"]}],
    })
    const result = await dialogBox
    if(!result.canceled){
      let TempData = MasterScript.toJSON()
      TempData.LeagueDir=undefined
      TempData.SelectedScreen=undefined
      const JsonData = JSON.stringify(TempData,null,2)
      fs.writeFileSync(result.filePath,JsonData,"utf-8")
      saveLocation=result.filePath
    }
    dialogBox=undefined
  } catch (error) {
    Log(new Error(),error)
    console.error(error);
    if(error.message!="dialog box is in use"){
      if(dialogBox){
        Log(new Error(),"dialog box is in use")
        console.error("dialog box is in use");
      }else{
        dialogBox = dialog.showMessageBox(null,{
          message: "There was problem saving the .JSON file. Contact Valentine",
          title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
          icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
        })
        const result = await dialogBox
        if(result)dialogBox=undefined;
      }
    }
  }
}
function isTokenExpired(token){
  try {
    return jwtDecode(token).exp < Math.floor(Date.now()/1000)
  } catch (error) {
    return true
  }
}
loadModules().then(()=>{
  bIsVerboseLogging = GetLoggingState()||false;
  SetVerbosity(bIsVerboseLogging)
  let bIsMouseDebugTools =false
  let MouseDebugThread
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
  ClearFile()
  const createPopup = ()=>{
    const {width,height}= screen.getPrimaryDisplay().workAreaSize
    popupWindow=new BrowserWindow({
      width: width*0.50,
      height: height*0.45,
      center:true,
      resizable:false,
      minimizable:false,
      maximizable:false,
      fullscreenable:false,
      title:"Input license key to continue",
      icon:path.join(__dirname,"./assets/neroicon.ico"),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    })
    popupWindow.setMenuBarVisibility(false)
    popupWindow.moveTop()
    popupWindow.webContents.openDevTools();
    popupWindow.loadFile(path.join(__dirname, 'main/license.html'));
    popupWindow.on("close",(e)=>{
      e.preventDefault()
      popupWindow.destroy()
      if(mainWindow)mainWindow.destroy();
      app.quit();
    })
  }

  const createWindow = () => {
    // Create the browser window.
    const {width,height}= screen.getPrimaryDisplay().workAreaSize
    let mainWindowState = windowStateKeeper({
      defaultHeight:Math.floor(height*0.65),
      defaultWidth:Math.floor(width*0.45)
    })
    const mainmenu = Menu.buildFromTemplate([
      {
       label:"File",
       submenu:[
        {
          label:"New",accelerator:"CommandOrControl+N",click:()=>{DeleteAllData();MasterScript=new Script();mainWindow.send("UpdateAll");}
        },
        {
          label:"New Priority",accelerator:"CommandOrControl+P",click:()=>{
            let newBlock = new Block()
            MasterScript.addBlock(newBlock)
            mainWindow.send("UpdateAll",MasterScript.toJSON())
          }
        },
        {
          label:"Open",accelerator:"CommandOrControl+O",click:()=>Open()
        },
        {type:"separator"},
        {
          label:"Save",accelerator:"CommandOrControl+S",click:()=>{
            if(saveLocation)
            {
              try {
                const JsonData = JSON.stringify(MasterScript.toJSON(),null,2)
                fs.writeFileSync(saveLocation,JsonData,"utf-8")
              } catch (error) {
                console.error("Could not save .JSON file: ",error.message)
                dialog.showMessageBox(null,{
                  message: "There was problem saving the .JSON file. Contact Valentine",
                  title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
                  icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
                })
              }
            }else{
              SaveAs()
            }
          }
        },
        {
          label:"Save As...",accelerator:"CommandOrControl+Shift+S",click:()=>SaveAs()
        },
        {type:"separator"},
        {
          label:"Exit",click:()=>{mainWindowState.saveState(); app.exit()}
        }
       ] 
      },
      {
        label:"Control",
        submenu:[
          {
            label:"Play",accelerator:"CommandOrControl+[",click:()=>Play()
          },{
            label:"Stop",accelerator:"CommandOrControl+]",click:()=>Stop()
          },{
            label:"Run test scans",accelerator:"CommandOrControl+\\",click:()=>{
              Play(true)
            }
          }
        ]
      },
      {
        label:"Help",
        submenu:[
          {
            label:"Show dev tools",accelerator:"F1",click:()=>{
              (mainWindow.webContents.isDevToolsOpened())?mainWindow.webContents.closeDevTools():mainWindow.webContents.openDevTools();
            }
          },
          {
            label:"Toggle verbose logs",click:()=>{
              bIsVerboseLogging=!bIsVerboseLogging;
              SetLoggingState(bIsVerboseLogging)
              shell.showItemInFolder(path.join(app.getPath("userData"),"log.txt"))
            }
          },
          {
            label:"Toggle mouse debug tools",click:()=>{
              bIsMouseDebugTools=!bIsMouseDebugTools
              mainWindow.send("ToggleMouseDebugTools",bIsMouseDebugTools)
              overlayWindow.send("ToggleMouseDebugTools",bIsMouseDebugTools)
              if(bIsMouseDebugTools){
                if(MouseDebugThread)clearInterval(MouseDebugThread); 
                MouseDebugThread=setInterval(() => {
                  let MousePos = robot.getMousePos()
                  let primarydisplay = screen.getPrimaryDisplay()
                  let flag=false
                  if(MousePos.x>(primarydisplay.bounds.width*primarydisplay.scaleFactor)||MousePos.x<primarydisplay.x){
                    flag=true
                  }else if(MousePos.y>(primarydisplay.bounds.height*primarydisplay.scaleFactor)||MousePos.y<primarydisplay.y){
                    flag=true
                  }
                  overlayWindow.send("MouseDetails",{Pos:MousePos,Color:(flag)?"NaN/Out of bounds":hexToRGB(robot.getPixelColor(MousePos.x,MousePos.y))})
                  mainWindow.send("MouseDetails",{Pos:MousePos,Color:(flag)?"NaN/Out of bounds":hexToRGB(robot.getPixelColor(MousePos.x,MousePos.y))})
                }, 50);
              }else{
                clearInterval(MouseDebugThread)
              }
            }
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
    if(process.env.NODE_ENV=="development"){
      // Open the DevTools.
      mainWindow.webContents.openDevTools();
    }
    mainWindow.on("close",(e)=>{
      mainWindowState.saveState()
      mainWindow.destroy();
      if(popupWindow)popupWindow.destroy();
      app.quit();
    })
    SetWindow(mainWindow)
  };
  function createOverlay()
  {
    overlayWindow = new BrowserWindow({
      width:screen.getPrimaryDisplay().workAreaSize.width,
      height:screen.getPrimaryDisplay().workAreaSize.height,
      transparent:true,
      frame:false,
      alwaysOnTop:true,
      resizable:false,
      fullscreen:true,
      skipTaskbar:true,
      webPreferences:{
        preload:path.join(__dirname,"preload.js"),
        transparent:true
      }
    })
    overlayWindow.loadFile(path.join(__dirname,"main/overlay.html"))
    overlayWindow.setIgnoreMouseEvents(true);
    // overlayWindow.setVisibleOnAllWorkspaces(true);
    // overlayWindow.setAlwaysOnTop(true, 'floating');
    // overlayWindow.webContents.openDevTools();
    overlayWindow.on('blur', () => {
      overlayWindow.moveTop();
    });
  }
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  function mainInit(){
    //if not, create license window
    //if license window closed, close app
    //if license is invalid, reopen license window with error
    //if license is valid, save license and destroy window
    createWindow();
    createOverlay();
    // // On OS X it's common to re-create a window in the app when the
    // // dock icon is clicked and there are no other windows open.
    // app.on('activate', () => {
    //   if (BrowserWindow.getAllWindows().length === 0) {
    //     createWindow();
    //     createOverlay()
    //   }
    // });
    function updateDisplayCount(...args)
    {
      console.log("UPDATING SCREENS FOR RENDERER");
      let Bounds=screen.getPrimaryDisplay().bounds
      overlayWindow.setBounds({x:0,y:0,width:Bounds.width,height:Bounds.height})
      overlayWindow.center()
      console.log("new overlayWindow.getBounds: ",overlayWindow.getBounds());
      mainWindow.send("UpdateDisplaySelection",[screen.getPrimaryDisplay()])
    }
    screen.on("display-metrics-changed",updateDisplayCount)
    screen.on('display-added',updateDisplayCount);
    screen.on('display-removed', updateDisplayCount);
    Play=async function(bIsTesting){
      try {
        if(dialogBox)throw new Error("Dialog box is in use");
        if(bIsTesting){
          if(!fs.existsSync(path.join(app.getPath("userData"),"TestScans"))){
            fs.mkdirSync(path.join(app.getPath("userData"),"TestScans"))
          }
          fs.readdirSync(path.join(app.getPath("userData"),"TestScans")).forEach((file) => {
            const filePath = path.join(path.join(app.getPath("userData"),"TestScans"), file);
            if (fs.statSync(filePath).isDirectory()) {
              clearDirectory(filePath);  // Recursively clear subdirectories
              fs.rmdirSync(filePath);    // Remove the subdirectory
            } else {
              fs.unlinkSync(filePath);   // Remove files
            }
          });
        } 
        if (MasterScript.Blocks.length<=0) {
  
          dialogBox=dialog.showMessageBox(null,{
            message: "You need a priority block to continue. This play button should not be visible.",
            title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
            icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
          });
          const result = await dialogBox
          if(result)dialogBox=undefined;
          return;
        }
        if(!MasterScript.getLeagueDir()){
          Log(new Error(),"User wans to use default screen reading, but hasn't given a league directory");
          console.log("MasterScript.Blocks: ",MasterScript.Blocks);
          for(let x=0;x<MasterScript.Blocks.length;x++){
            console.log("MasterScript.Blocks[x]: ",MasterScript.Blocks[x]);
            if(MasterScript.Blocks[x].spellSlot!=6){
              dialogBox= dialog.showMessageBox(null,{
                message: "You need to reference your League of Legends installation folder to use anything other than the\"custom location\" option. (This is because the app will read your HUD config and scale the coords in real time)",
                title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
                icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
              })
              const result=await dialogBox
              if(result)dialogBox=undefined;
              return;
            }
          }
        }
        Log(new Error(),"master script selected screen: ",MasterScript.getSelectedScreen());
        if(!MasterScript.getSelectedScreen())MasterScript.changeSelectedScreen(screen.getPrimaryDisplay())
        if(!ScanningAbilityBorderLocations[4][""+(MasterScript.getSelectedScreen().size.height*MasterScript.getSelectedScreen().scaleFactor)]){
          Log(new Error(),"Screen isnt supported");
          Log(new Error(),"Blocks: ",MasterScript.Blocks);
          Log(new Error(),"MasterScript.getLeagueDir(): ",MasterScript.getLeagueDir());
          MasterScript.Blocks.forEach(async(element)=>{
            if(element.spellSlot!=6){
              Log(new Error(),"Screen isnt supported and the user wants presets enabled");
              dialogBox=dialog.showMessageBox(null,{
                message: "Your monitor resolution isn't supported. Please change \"border start\" or \"border end\" to custom and manually insert the pixel coordinates you'd like this app to scan for.",
                title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
                icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
              })
              const result=await dialogBox
              if(result)dialogBox=undefined;
              return;
            }
          })
        }
        for(let x=0;x<MasterScript.Blocks.length;x++){
          if(MasterScript.Blocks[x].scanType=="image"&&(!MasterScript.Blocks[x].ScanImagePath||!fs.existsSync(MasterScript.Blocks[x].ScanImagePath))){
              dialogBox= dialog.showMessageBox(null,{
                message: `Priority block #${x+1} is missing the image template to compare the screen with`,
                title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
                icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
              })
              const result=await dialogBox
              if(result)dialogBox=undefined;
              return;
          }
        }
        if(!dialogBox){
          if(bIsTesting){
            await MasterScript.updateScaleFactor()
            for(let x=0;x<MasterScript.Blocks.length;x++){
              await MasterScript.checkImageScan(MasterScript.Blocks[x],bIsTesting,x)
            }
            shell.openPath(path.join(app.getPath("userData"),"TestScans")).catch(err=>console.log(err))
          }else{
            mainWindow.send("UpdatePlayPauseState",true)
            MasterScript.startScanning(overlayWindow,mainWindow);
            //when finished, open dir
          }
        }
      } catch (error) {
        Log(new Error(),error)
        console.error(error);
      }
    }
    Stop=function(){
      Log(new Error(),"Stopping scanning process")
      MasterScript.stopScanning();
      mainWindow.send("UpdatePlayPauseState",false)
    }
    ipcMain.on("ChangeHeartbeat",(e,value)=>{
      (value>=1)?MasterScript.heartbeat = value:MasterScript.heartbeat=1;
      SetSavedScript(MasterScript.toJSON())
      mainWindow.send("UpdateHeartbeat",(value>=1)?value:1)
    })
    ipcMain.on("ChangeValue",(e,index,channel,value)=>{
      try {
        let Block = MasterScript.Blocks.find(block=>block.UUID===index)
        if(!Block){console.log("Failed to find block with UUID: ",index," ,current blocks: ",MasterScript.Blocks); throw new Error("Failed to find block with UUID: "+index+" ,current blocks: "+MasterScript.Blocks);}
        Block[channel]=value
        SetSavedScript(MasterScript.toJSON())
      } catch (error) {
        console.error("Error: ",error)
      }
    })
    ipcMain.on("PlayPauseScan",()=>{
      if(MasterScript.scanningThread){
        Stop()
      }else{
        Play()
      }
    })
    ipcMain.handle("CreateDestroyOutput",(e,bCreate,BlockUUID,UUID)=>{
      let Block = MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
      Log(new Error(),"UUID: ",BlockUUID);
      Log(new Error(),"Block: ",Block);
      if(!Block)return;
      Log(new Error(),"OutputArray before: ",Block.outputArray);
      let Output={UUID:0};
      if(bCreate)
      {
        //create
        Output={
          UUID:generateUUID("outputIdSet"),
          cmd:"play",//possible cmds: play,play-all,sub,set,prevent,add,stop-all-lower,
          stack:"Jackpot",
          value:0
        }
        Block.outputArray.push(Output)
      }else{
        //destroy
        Block.outputArray=Block.outputArray.filter(output=>output.UUID!==UUID)
      }
      Log(new Error(),"CondArray after: ",Block.outputArray);
      SetSavedScript(MasterScript.toJSON())
      return Output.UUID
    })
    ipcMain.on("ChangeOutputValue",(e,BlockUUID,UUID,channel,value)=>{
      try {
        let Block = MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
        if(!Block)throw new Error("Couldn't find target block with UUID provided: ",BlockUUID);
        let Output=Block.outputArray.find(Outputs=>Outputs.UUID===UUID)
        if(!Output)throw new Error("Couldn't find target output with UUID provided: ",UUID);
        Log(new Error(),"Block.outputArray: ",Block.outputArray);
        Log(new Error(),"Channel: ",channel);
        Log(new Error(),"value: ",value);
        Log(new Error(),"UUID: ",UUID);
        
        Output[channel]=value
        SetSavedScript(MasterScript.toJSON())
      } catch (error) {
        console.error("Error occured: ",error)
        return false
      }
    })
    ipcMain.on("ChangePostOpValue",(e,BlockUUID,UUID,channel,value)=>{
      try {
        let Block = MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
        if(!Block)throw new Error("Couldn't find target block with UUID provided: ",BlockUUID);
        let PostOp=Block.PostTrackOperations.find(PostOp=>PostOp.UUID===UUID)
        if(!PostOp)throw new Error("Couldn't find target output with UUID provided: ",UUID);
        Log(new Error(),"Block.PostOpArray: ",Block.PostTrackOperations);
        PostOp[channel]=value
        SetSavedScript(MasterScript.toJSON())
      } catch (error) {
        console.error("Error occured: ",error)
        return false
      }
    })
    ipcMain.handle("CreateDestroyCond",(e,bCreate,BlockUUID,value)=>{
      let Block = MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
      if(!Block)return;
      Log(new Error(),"CondArray before: ",Block.conditionalArray);
      let Conditional={UUID:0}
      if(bCreate)
      {
        //create
        Conditional ={
          UUID:generateUUID("condIdSet"),
          condOperator:"",
          condStack:"Jackpot",
          condInput:0,
          condOutput:"",
        }
        Block.conditionalArray.push(Conditional)
      }else{
        //destroy
        Block.conditionalArray=Block.conditionalArray.filter(condit=>condit.UUID!==value)
      }
      SetSavedScript(MasterScript.toJSON())
      return Conditional.UUID
    })
    ipcMain.handle("CreateDestroyPostOp",(e,bCreate,BlockUUID,value)=>{
      let Block = MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
      if(!Block)return;
      Log(new Error(),"PostOP before: ",Block.PostTrackOperations);
      let PostOP={UUID:0}
      if(bCreate)
      {
        //create
        PostOP ={
          UUID:generateUUID("postTrackOps"),
          cmd:"play",//possible cmds: play,play-all,sub,set,prevent,add,stop-all-lower,
          stack:"Jackpot",
          value:0
        }
        Block.PostTrackOperations.push(PostOP)
      }else{
        //destroy
        Block.PostTrackOperations=Block.PostTrackOperations.filter(Postop=>Postop.UUID!==value)
      }
      SetSavedScript(MasterScript.toJSON())
      return PostOP.UUID
    })
    ipcMain.on("ChangeCondValue",(e,BlockUUID,UUID,channel,value)=>{
      let Block= MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
      if(!Block)return;
      let Condit = Block.conditionalArray.find(condits=>condits.UUID===UUID)
      if(!Condit)return;
      Condit[channel]=value
      SetSavedScript(MasterScript.toJSON())
    })
    ipcMain.handle("OpenDirDialog",async()=>{
      if(dialogBox)return;
      dialogBox=dialog.showOpenDialog({
        properties:["openDirectory"],
        defaultPath:(GetLeagueDirSave())?GetLeagueDirSave():"C:\\Program Files\\Riot Games\\League of Legends"
      })
      const result = await dialogBox
      if(!result.canceled){
        if (!fs.existsSync(path.join(result.filePaths[0],"Config","PersistedSettings.json"))) {
          dialog.showMessageBox(null,{
            message: "The directory selected doesn't have \"PersistedSettings.json\" in \"config\" folder. Try selecting a valid League of Legends installation folder.",
            title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
            icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
          })
          dialogBox=undefined
          return
        }
      }
      // SetLeagueDirSave(result.filePaths[0])
      MasterScript.changeLeagueDir(result.filePaths[0])
      SetSavedScript(MasterScript.toJSON())
      dialogBox=undefined
      return result.filePaths[0]
    })
    ipcMain.handle("OpenImg",async(e,UUID)=>{
      let Block= MasterScript.Blocks.find(block=>block.UUID===UUID)
      if(!Block){console.log("Couldn't find block");return;}
      if(dialogBox){console.log("Dialog box is active");return;}
      dialogBox=dialog.showOpenDialog({
        properties:["openFile"],
        filters:[{name:"images",extensions:["png","jpeg"]}]
      })
      const result = await dialogBox
      if(!result.canceled&&fs.existsSync(path.join(result.filePaths[0])))
        {
          Block.ScanImagePath=result.filePaths[0]
          dialogBox=undefined
          SetSavedScript(MasterScript.toJSON())
          return result.filePaths[0]
        }
        dialogBox=undefined
        return false
    })
    ipcMain.handle("OpenFill",async(e,UUID)=>{
      let Block= MasterScript.Blocks.find(block=>block.UUID===UUID)
      if(!Block)return;
      if(dialogBox)return;
      dialogBox=dialog.showOpenDialog({
        properties:["openFile"],
        filters:[{name:"images",extensions:["png","jpeg"]}]
      })
      const result = await dialogBox
      if(!result.canceled&&fs.existsSync(path.join(result.filePaths[0])))
        {
          Block.VisualizerFillPatternPath=result.filePaths[0]
          dialogBox=undefined
          SetSavedScript(MasterScript.toJSON())
          return result.filePaths[0]
        }
        dialogBox=undefined
        return false
    })
    ipcMain.handle("OpenTrack",async(e,UUID)=>{
      try {
        if(dialogBox)throw new Error("Dialog box is in use");
        let Block = MasterScript.Blocks.find(block=>block.UUID===UUID);
        if(!Block)throw new Error("Could not find block with provided UUID");
        dialogBox = dialog.showOpenDialog({
          filters:[{name:"Audio files",extensions:["mp3","wav"]}],
          properties:["openFile"],
        })
        const result = await dialogBox
        if(!result.canceled&&fs.existsSync(path.join(result.filePaths[0])))
        {
          let NewTrack = new Track(path.join(result.filePaths[0]))
          Block.addTrack(NewTrack)
          dialogBox=undefined
          SetSavedScript(MasterScript.toJSON())
          let tracks =[]
          if(Block.Tracks.length>0)Block.Tracks.forEach(track=>tracks.push({TrackURL:track.TrackURL,UUID:track.UUID}));
          Log(new Error(),"tracks: ",tracks)
          return tracks
        }
        dialogBox=undefined
        return false
        
      } catch (error) {
        Log(new Error(),error)
        return false
      }
    })
    ipcMain.handle("RemoveTrack",(e,UUID,value)=>{let Block = MasterScript.Blocks.find(block=>block.UUID===UUID)
      if(!Block)return;
      console.log("Calling block.removetrack");
      
      Block.removeTrack(value)
      SetSavedScript(MasterScript.toJSON())
      return Block.Tracks
    })
    ipcMain.handle("CreatePriority",()=>{
      let newBlock = new Block()
      let UUID = newBlock.UUID
      MasterScript.addBlock(newBlock)
      SetSavedScript(MasterScript.toJSON())
      return UUID
    })
    ipcMain.handle("RemovePriority",(e,UUID)=>{
      MasterScript.removeBlock(UUID)
      Log(new Error(),"Master Script: ",MasterScript);
      mainWindow.send("UpdateAll",MasterScript)
      SetSavedScript(MasterScript.toJSON())
      return MasterScript.Blocks.length
    })
    ipcMain.handle("GetNumOfPriorities",()=>{
      if (MasterScript.Blocks)return MasterScript.Blocks.length
      return 0
    })
    ipcMain.on("log",(e,...msg)=>{
      console.log(...msg); 
      if(bIsVerboseLogging){
        const seen = new WeakSet();
          const finalizedString = msg.map(arg => 
            typeof arg === 'object' 
              ? JSON.stringify(arg, (key, value) => {
                  if (value !== null && typeof value === 'object') {
                    if (seen.has(value)) {
                      return '[Object object]';
                    }
                    seen.add(value);
                  }
                  return value;
                }, " ") 
              : (arg === undefined ? arg : arg.toString())
          ).join(' ');
          let now = new Date();
          let formatDate = `[${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}:${String(now.getMilliseconds()).padStart(3, '0')}]`;
          WriteStream(`\n${formatDate} ` + finalizedString);
      }
    })
    mainWindow.send("UpdateDisplaySelection",[screen.getPrimaryDisplay()])
    MasterScript = new Script(undefined,screen.getPrimaryDisplay(),Pixelmatch)
    try {
      let Data = GetSavedScript();
      Log(new Error(),"Data: ",Data);
      MasterScript.parseJSON(Data)
    } catch (error) {
      Log(new Error(),error)
      MasterScript = new Script(undefined,screen.getPrimaryDisplay(),Pixelmatch)
    }
    mainWindow.send("UpdateAll",MasterScript)
    updateDisplayCount()
    //#region KEYBOARD LISTENER
    Log(new Error(),"Attaching keyboard listener...");
    const kbWorker = new Worker(path.join(__dirname,"./workers/KbListenerWorker.js"))
    kbWorker.on("message",({command,data})=>{
      switch (command) {
        case "play":
          if(!mainWindow.isFocused())Play(data);
          break;
        case "stop":
          if(!mainWindow.isFocused())Stop();
          break;
        default:
          console.error("no command given")
          break;
      }
    })
    kbWorker.on("error", (err) => console.error("Worker Error:", err));
    kbWorker.on("exit", (code) => {
      if (code !== 0) console.error(`Worker exited with code ${code}`);
    });
  }
  async function SubmitLicenseKey(key){
    try {
      const response = await axios({
        url:"http://localhost:3000/license/validate",
        method:"PATCH",
        data:{token:key,machineId:machineIdSync()}
      })
      // Log(new Error(),response)
      if(response.status==200){
        //save JWT
        SetJWT(response.data)
        //save license key
        SetLicenseKey(key)
        mainInit()
        popupWindow.destroy()
        return true
      }
      return false
    } catch (error) {
      Log(new Error(),error.message)
      return false
    }
  }

  app.whenReady().then(async() => {
    //Check if license is saved
    if (!GetJWT()||isTokenExpired(GetJWT().accessToken)){
      Log(new Error(),"JWT is missing or expired. Checking for license key")
      let licenseKey = GetLicenseKey()||""
      if(licenseKey==""){
        //if not, create license window
        if(!popupWindow)createPopup();
      }else{
        //do verification of JWT. 
        try {
          Log(new Error(),"Attempting to generate new JWT")
          const result = await axios({
            url:"http://localhost:3000/license/verify",
            method:"POST",
            data:{licenseKey:licenseKey,refreshToken:GetJWT().refreshToken,machineId:machineIdSync()}
          })
          if(result.status==200){
            Log(new Error(),"successfully generated new JWT. continuing")
            //save JWT
            SetJWT(result.data)
            //save license key
            // SetLicenseKey(key)
            mainInit()
            // popupWindow.destroy()
            return true
          }else{
            throw new Error("Status code was not 200")
          }
        } catch (error) {
          Log(new Error(),"Something went wrong")
          (error.message)?Log(new Error(),error.message):Log(new Error(),error.status)
          SetJWT("")
          SetLicenseKey("")
          createPopup();
        }
      }
    }else{
      mainInit()
    }
    ipcMain.on("CreatePayPalOrder",async()=>{
      try {
        const response =await axios({
          url:"http://localhost:3000/pp/pay",
          method:"POST"
        })
        if(response.request.res.responseUrl)shell.openExternal(response.request.res.responseUrl)
      } catch (error) {
        Log(new Error(),error)
        popupWindow.send("OnError",error.code)
      }
    })
    ipcMain.handle("SubmitLicenseKey",async(e,key)=>{
      SubmitLicenseKey(key)
    })
    
    // let kbListener
    // kbListener = new GlobalKeyboardListener({windows:{onError:(err)=>console.log(err)}})
    // kbListener.addListener((e,down)=>{
    //   if(e.state=="UP")return;
    //   if (!["SQUARE BRACKET OPEN", "SQUARE BRACKET CLOSE", "BACKSLASH"].includes(e.name)) return;
    //   console.log("Valid key pressed")
    //   if(e.state=="DOWN"&&e.name=="SQUARE BRACKET OPEN"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
    //     if(mainWindow.isFocused())return;
    //     console.log("Start playing");
    //     if(MasterScript.scanningThread)return;
    //     Play()
    //   }else if(e.state=="DOWN"&&e.name=="SQUARE BRACKET CLOSE"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
    //     if(mainWindow.isFocused())return;
    //     if(!MasterScript.scanningThread)return;
    //     console.log("Stop playing");
    //     Stop()
    //   }else if(e.state=="DOWN"&&e.name=="BACKSLASH"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
    //     if(mainWindow.isFocused())return;
    //     Play(true)
    //   }
    // })
    //#endregion
  })
})
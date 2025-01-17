const {app, BrowserWindow,Menu,ipcMain,screen, dialog, desktopCapturer,shell } = require("electron");
const windowStateKeeper = require("electron-window-state");
const path = require("node:path")
const robot = require("robotjs")
const sharp = require("sharp")
//const pixelmatch = require("pixelmatch")
const fs = require("fs")
const {Script,Block,Track,ScanningAbilityBorderLocations,generateUUID,setLoggingState,ErrorParse} = require("./audioHandler");
const {ClearFile,Log,SetDir} = require("./logging.js")
const {GlobalKeyboardListener} = require("node-global-key-listener")
SetDir(app.getPath("userData"))
let mainWindow,source,MasterScript,overlayWindow,Play,Stop
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
let GetLeagueDirSave,SetLeagueDirSave,GetSavedScript,SetSavedScript,DeleteAllData,dialogBox,saveLocation,GetLoggingState,SetLoggingState,Pixelmatch
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
  Pixelmatch=module2.Pixelmatch
}
async function Open()
{
  if(dialogBox)return;
  dialogBox = dialog.showOpenDialog({
    filters:[{name:"JSON",extensions:["json"]}],
    properties:["openFile"],
  })
  const result = await dialogBox
  if(!result.canceled){
    try {
      const jsonData = fs.readFileSync(result.filePaths[0], "utf-8");
      const data = JSON.parse(jsonData);
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),data);
      MasterScript.parseJSON(data)
      mainWindow.send("UpdateAll",data)
      } catch (error) {
        console.error("Error reading or parsing JSON file:", error.message);
        dialog.showMessageBox(null,{
          message: "There was problem reading the .JSON file. Contact Valentine",
          title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
          icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
        })
      }
  }
  dialogBox=undefined
}
async function SaveAs()
{
  if(dialogBox)return;
  dialogBox = dialog.showSaveDialog({
    filters:[{name:"JSON",extensions:["json"]}],
  })
  const result = await dialogBox
  if(!result.canceled)
  {
    try {
      let TempData = MasterScript.toJSON()
      TempData.LeagueDir=undefined
      TempData.SelectedScreen=undefined
      const JsonData = JSON.stringify(TempData,null,2)
      fs.writeFileSync(result.filePath,JsonData,"utf-8")
      saveLocation=result.filePath
    } catch (error) {
      console.error("Could not save .JSON file: ",error.message)
      dialog.showMessageBox(null,{
        message: "There was problem saving the .JSON file. Contact Valentine",
        title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
        icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
      })
    }
  }
  dialogBox=undefined
}
loadModules().then(()=>{
  let bIsVerboseLogging = GetLoggingState()||false;
  setLoggingState(bIsVerboseLogging)
  if (require("electron-squirrel-startup")) {
    app.quit();
  }
  ClearFile()
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
            label:"Run test scans",accelerator:"CommandOrControl+T",click:()=>{
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
              if(bIsVerboseLogging)shell.showItemInFolder(path.join(app.getPath("userData"),"log.txt"))
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
    //overlayWindow.webContents.openDevTools();
    overlayWindow.on('blur', () => {
      overlayWindow.moveTop();
    });
  }
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();
    createOverlay();
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        createOverlay()
      }
    });
  
    function updateDisplayCount(...args)
    {
      console.log("UPDATING SCREENS FOR RENDERER");
      
      mainWindow.send("UpdateDisplaySelection",[screen.getPrimaryDisplay()])
    }
    screen.on('display-added',updateDisplayCount);
    screen.on('display-removed', updateDisplayCount);
    let ToggleState=false

    Play=async function(bIsTesting){
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
      if (MasterScript.Blocks.length<1) {
        dialog.showMessageBox(null,{
          message: "You need a priority block to continue. This play button should not be visible.",
          title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
          icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
        });
        return;
      }
      if(!MasterScript.getLeagueDir()){
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"User wans to use default screen reading, but hasn't given a league directory");
        dialog.showMessageBox(null,{
          message: "You need to reference your League of Legends installation to use \"border start\" or \"border end\" options. (This is because the app will read your HUD config and scale the coords in real time)",
          title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
          icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
        })
        return;
      }
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),"master script selected screen: ",MasterScript.getSelectedScreen());
      if(!ScanningAbilityBorderLocations[4][""+MasterScript.getSelectedScreen().size.height]){
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Screen isnt supported");
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Blocks: ",MasterScript.Blocks);
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"MasterScript.getLeagueDir(): ",MasterScript.getLeagueDir());
        MasterScript.Blocks.forEach((element)=>{
          if(element.scanLocation!="custom"){
            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Screen isnt supported and the user wants presets enabled");
            dialog.showMessageBox(null,{
              message: "Your monitor resolution isn't supported. Please change \"border start\" or \"border end\" to custom and manually insert the pixel coordinates you'd like this app to scan for.",
              title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
              icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
            })
            return;
          }
        })
      }
      if(bIsTesting){
        await MasterScript.updateScaleFactor()
        for(let x=0;x<MasterScript.Blocks.length;x++){
          await MasterScript.checkImageScan(MasterScript.Blocks[x],bIsTesting,x)
        }
        shell.openPath(path.join(app.getPath("userData"),"TestScans")).catch(err=>console.log(err))
      }else{
        MasterScript.startScanning(overlayWindow,mainWindow);
        mainWindow.send("UpdatePlayPauseState",true)
        //when finished, open dir
      }
    }
    Stop=function(){
      MasterScript.stopScanning();
      mainWindow.send("UpdatePlayPauseState",false)
    }
/**
 * 
 * @param {Number} x 0 = left-most side of screen  
 * @param {Number} y 0 = top-most side of screen
 * @param {Number} width 
 * @param {Number} height 
 * @returns {Array}
 */
    function captureRegionToArray(x,y,width,height){
      const screenImage = robot.screen.capture(x,y,width,height)
      const pixelData=[];
      for(let i=0;i<screenImage.image.length;i+=4)
      {
        pixelData.push({
          r:screenImage.image[i],
          g:screenImage.image[i+1],
          b:screenImage.image[i+2],
          a:screenImage.image[i+3]
        })
      }
      return pixelData
    }
    function getAlpha(currentValue, min, max) {
      if (currentValue < min) currentValue = min;
      if (currentValue > max) currentValue = max;
      return (currentValue - min) / (max - min);
    }
    function saveArrayToPNG(pixelData,width,height,outputPath)
    {
      const buffer = Buffer.alloc(pixelData.length*4);
      pixelData.forEach((color,index)=>{
        const offset = index*4
        buffer[offset]=color.r
        buffer[offset+1]=color.g
        buffer[offset+2]=color.b
        buffer[offset+3]=color.a
      })
      //sharp(buffer,{raw:{width,height,channels:4}}).toFile(path.join(__dirname,"UntouchedRawBuffer.png"))
      sharp(buffer,{raw:{width,height,channels:4}})
        .resize(64,64)
        .raw()
        .toBuffer()
        .then((newBuffer)=>{

          const FixedBuffer = Buffer.alloc(newBuffer.length)
          for (let i=0;i<newBuffer.length;i+=4)
          {
            FixedBuffer[i] = newBuffer[i + 2];     // Red
            FixedBuffer[i + 1] = newBuffer[i + 1]; // Green
            FixedBuffer[i + 2] = newBuffer[i];     // Blue
            FixedBuffer[i + 3] = newBuffer[i + 3]; // Alpha
          }
          //sharp(FixedBuffer,{raw:{width,height,channels:4}}).toFile(path.join(__dirname,"Buffer1.png"))
          console.log(typeof FixedBuffer);
          sharp(path.join(__dirname,"aatrox_r.png")).resize(64,64).ensureAlpha().raw().toBuffer().then((imageBuffer)=>{
            console.log(typeof imageBuffer);
            if (FixedBuffer.length !== imageBuffer.length) {
              console.error("Buffer lengths do not match!");
              console.log("New Buffer Length:", FixedBuffer.length);
              console.log("Image Buffer Length:", imageBuffer.length);
              return;
            }
            const diff = Buffer.alloc(FixedBuffer.length)
            const NumOfMismatch = Pixelmatch(imageBuffer,FixedBuffer,diff,64,64,{diffMask:true,threshold: 0.2})
            console.log("square area of image: ",width*height);
            
            let Similarity = 1-getAlpha(NumOfMismatch,0,width*height)
            console.log("similarity: ",Similarity);
            
            console.log("Num of mismatch pixels: ",NumOfMismatch);
            sharp(diff, { raw: { width: 64, height: 64, channels: 4 } })
                .toFile(path.join(__dirname,"diff.png"))
                .then(() => console.log("Diff image saved as diff.png"))
                .catch((err) => console.error("Error saving diff image:", err));
          })
        })
        .catch((err)=>console.log("error: ",err));
        sharp(path.join(__dirname,"aatrox_r.png")).resize(64,64).ensureAlpha().toFile(path.join(__dirname,"Buffer2.png"))
    }

    ipcMain.on("TestImageScanToggle",(e)=>{
      ToggleState=!ToggleState
      if(ToggleState)
      {
        //1165x1346  64
        // 1246 X
        // 1283 Y
        //NEEDS TO BE TOP LEFT CORNER
        let x=1165+81 ,y=1346-63,width=64,height=64
        const pixelData=captureRegionToArray(x,y,width,height)
        console.log("PixelData: ",pixelData);
        saveArrayToPNG(pixelData, width, height, path.join(__dirname,'output.png'));
        //const screen = robot.screen.capture(z)
      }
    })

    // ipcMain.on("ChangeDisplay",(e,DisplayNum)=>{
    //   MasterScript.changeSelectedScreen(screen.getAllDisplays()[DisplayNum])
    //   SetSavedScript(MasterScript.toJSON())
    // })

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
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),"UUID: ",BlockUUID);
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block: ",Block);
      if(!Block)return;
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),"OutputArray before: ",Block.outputArray);
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
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),"CondArray after: ",Block.outputArray);
      SetSavedScript(MasterScript.toJSON())
      return Output.UUID
    })
    ipcMain.on("ChangeOutputValue",(e,BlockUUID,UUID,channel,value)=>{
      try {
        let Block = MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
        if(!Block)throw new Error("Couldn't find target block with UUID provided: ",BlockUUID);
        let Output=Block.outputArray.find(Outputs=>Outputs.UUID===UUID)
        if(!Output)throw new Error("Couldn't find target output with UUID provided: ",UUID);
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block.outputArray: ",Block.outputArray);
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Channel: ",channel);
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"value: ",value);
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"UUID: ",UUID);
        
        Output[channel]=value
        SetSavedScript(MasterScript.toJSON())
      } catch (error) {
        console.error("Error occured: ",error)
        return false
      }
    })
    ipcMain.handle("CreateDestroyCond",(e,bCreate,BlockUUID,value)=>{
      let Block = MasterScript.Blocks.find(block=>block.UUID===BlockUUID)
      if(!Block)return;
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),"CondArray before: ",Block.conditionalArray);
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
        Block.conditionalArray=Block.conditionalArray.filter(condit=>condit.UUID!==condit.UUID)
      }
      SetSavedScript(MasterScript.toJSON())
      return Conditional.UUID
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
      if (!fs.existsSync(path.join(result.filePaths[0],"Config","PersistedSettings.json"))) {
        dialog.showMessageBox(null,{
          message: "The directory selected doesn't have \"PersistedSettings.json\" in \"config\" folder. Try selecting a valid League of Legends installation folder.",
          title:errorTitles[Math.floor(Math.random()*errorTitles.length)],
          icon:path.join(__dirname,"assets/vergilshonestreaction.jpg")
        })
        dialogBox=undefined
        return
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
      if(dialogBox)return;
      let Block = MasterScript.Blocks.find(block=>block.UUID===UUID);
      if(!Block)return;
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
        return Block.Tracks
      }
      dialogBox=undefined
      return false
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
      if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Master Script: ",MasterScript);
      
      mainWindow.send("UpdateAll",MasterScript)
      SetSavedScript(MasterScript.toJSON())
      return MasterScript.Blocks.length
    })
   
    ipcMain.handle("GetNumOfPriorities",()=>{
      if (MasterScript.Blocks)return MasterScript.Blocks.length
      return 0
    })

    mainWindow.send("UpdateDisplaySelection",[screen.getPrimaryDisplay()])
    
    MasterScript = new Script(undefined,screen.getPrimaryDisplay(),Pixelmatch)

    let Data = GetSavedScript();
    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Data: ",Data);
    MasterScript.parseJSON(Data)
    mainWindow.send("UpdateAll",MasterScript)
    updateDisplayCount()
    //#region KEYBOARD LISTENER
    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Attaching keyboard listener...");
    let kbListener
    kbListener = new GlobalKeyboardListener({windows:{onError:(err)=>console.log(err)}})
    kbListener.addListener((e,down)=>{
      if(e.state=="DOWN"&&e.name=="SQUARE BRACKET OPEN"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
        console.log("Start playing");
        Play()
      }else if(e.state=="DOWN"&&e.name=="SQUARE BRACKET CLOSE"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
        console.log("Stop playing");
        Stop()
      }else if(e.state=="DOWN"&&e.name=="BACKSLASH"&&(down["LEFT CTRL"]||down["RIGHT CTRL"])){
        Play(true)
      }
    })
    //#endregion
   
    // if(bIsVerboseLogging)Log(ErrorParse(new Error()),path.join(__dirname,"./Devil Trigger Start.wav"));
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
    //     if(bIsVerboseLogging)Log(ErrorParse(new Error()),"song ended?");
    //     if(source)source.disconnect()
    //   }

    //   AsyncTween(gainNode,1,0,3000)
    //   if(bIsVerboseLogging)Log(ErrorParse(new Error()),"working");
      
    //   // setTimeout(()=>{
    //   //   source.stop()
    //   //   //stops the song
    //   // },3000)
    //   } catch (error) {
    //     if(bIsVerboseLogging)Log(ErrorParse(new Error()),"error: ",error)
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
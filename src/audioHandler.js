const path = require("node:path")
const {Lame} = require("node-lame")
const AudioContext = require("node-web-audio-api").AudioContext
const fs = require("fs")
const robot=require("robotjs")
const sharp = require("sharp")
const {Log} = require("./logging.js")
const {app} = require("electron");
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};
let bIsVerboseLogging=false
let mainWindow,Pixelmatch
let Threshold=0.2
//scale value for border start: 0.9555
const ScanningAbilityBorderLocations = [
    {
        //Passive
        "720":{
            "border-start":{Max:529,MaxY:661,MinX:470,MinY:632},
            "border-end":{Max:522,MaxY:661,MinX:463,MinY:632},
            "border-half-way":{MaxX:526,MaxY:680,MinX:467,MinY:659}
        },
        "1080":{
            "border-start":{Max:792,MaxY:993,MinX:704,MinY:948},
            "border-end":{Max:785,MaxY:993,MinX:698,MinY:948},
            "border-half-way":{MaxX:789,MaxY:1020,MinX:701,MinY:990}
        },
        "1440":{
            "border-start":{MaxX:1055,MaxY:1324,MinX:938,MinY:1265},
            "border-end":{MaxX:1048,MaxY:1324,MinX:931,MinY:1265},
            "border-half-way":{MaxX:1052,MaxY:1361,MinX:935,MinY:1320}
        }
    },
    {
        //Q
        "720":{
            "border-start":{Max:554,MaxY:661,MinX:509,MinY:632},
            "border-end":{Max:547,MaxY:661,MinX:502,MinY:632},
            "border-half-way":{MaxX:551,MaxY:686,MinX:506,MinY:669}
        },
        "1080":{
            "border-start":{Max:830,MaxY:993,MinX:762,MinY:948},
            "border-end":{Max:823,MaxY:993,MinX:755,MinY:948},
            "border-half-way":{MaxX:827,MaxY:1029,MinX:759,MinY:1005}
        },
        "1440":{
            "border-start":{MaxX:1106,MaxY:1324,MinX:1015,MinY:1265},
            "border-end":{MaxX:1099,MaxY:1324,MinX:1008,MinY:1265},
            "border-half-way":{MaxX:1103,MaxY:1373,MinX:1012,MinY:1339}
        }
    },
    {
        //W
        "720":{
            "border-start":{Max:583,MaxY:661,MinX:553,MinY:632},
            "border-end":{Max:577,MaxY:661,MinX:546,MinY:632},
            "border-half-way":{MaxX:580,MaxY:686,MinX:550,MinY:669}
        },
        "1080":{
            "border-start":{Max:874,MaxY:993,MinX:828,MinY:948},
            "border-end":{Max:867,MaxY:993,MinX:822,MinY:948},
            "border-half-way":{MaxX:871,MaxY:1029,MinX:825,MinY:1005}
        },
        "1440":{
            "border-start":{MaxX:1165,MaxY:1324,MinX:1104,MinY:1265},
            "border-end":{MaxX:1157,MaxY:1324,MinX:1097,MinY:1265},
            "border-half-way":{MaxX:1161,MaxY:1373,MinX:1100,MinY:1339}
        }
    },
    {
        //E
        "720":{
            "border-start":{Max:613,MaxY:661,MinX:597,MinY:632},
            "border-end":{Max:606,MaxY:661,MinX:591,MinY:632},
            "border-half-way":{MaxX:610,MaxY:686,MinX:594,MinY:669}
        },
        "1080":{
            "border-start":{Max:918,MaxY:993,MinX:895,MinY:948},
            "border-end":{Max:911,MaxY:993,MinX:888,MinY:948},
            "border-half-way":{MaxX:915,MaxY:1029,MinX:892,MinY:1005}
        },
        "1440":{
            "border-start":{MaxX:1223,MaxY:1324,MinX:1192,MinY:1265},
            "border-end":{MaxX:1216,MaxY:1324,MinX:1186,MinY:1265},
            "border-half-way":{MaxX:1220,MaxY:1373,MinX:1189,MinY:1339}
        }
    },
    {
        //R
        "720":{
            "border-start":{Max:642,MaxY:661,MinX:642,MinY:632},
            "border-end":{Max:635,MaxY:661,MinX:635,MinY:632},
            "border-half-way":{MaxX:639,MaxY:686,MinX:639,MinY:669}
        },
        "1080":{
            "border-start":{Max:962,MaxY:993,MinX:961,MinY:948},
            "border-end":{Max:955,MaxY:993,MinX:955,MinY:948},
            "border-half-way":{MaxX:959,MaxY:1029,MinX:958,MinY:1005}
        },
        "1440":{
            "border-start":{MaxX:1282,MaxY:1324,MinX:1281,MinY:1265},
            "border-end":{MaxX:1275,MaxY:1324,MinX:1275,MinY:1265},
            "border-half-way":{MaxX:1279,MaxY:1373,MinX:1278,MinY:1339}
        }
    }
]
const ScanningPictureRegions=[
    {
        //Passive
    },{
        //Q
    },{
        //W
    },{
        //E
    },{
        //R
        "1440":{
            //48x48, 1255 1325
            //75x75 1241 1265
            MinX:1241,
            MinY:1265,
            MinScale:48,
            MaxX:1255,
            MaxY:1325,
            MaxScale:75
        }
    },{
        //Buffs
        "1080":{
            //AT 0 scale: 23x23, starts at 753,897, padding 4px
            //AT 1 scale: 36x36, starts at 646,807, padding 4px
        },
        "1440":{
            MinX:862,
            MinY:1079,
            MinScale:31,
            MaxX:1004,
            MaxY:1201,
            MaxScale:48
            //AT 0 SCALE: 31x31, starts at 1004,1201, padding 4px. 
            //AT 1 SCALE: 48x48, starts at 862,1079, padding 4px, 6x3 cells
        }
    },
    {
        padding:4,
        width:6,
        height:3
    }
]
const ColorPresets ={
    "yellow":[255,251,189],
    "gold":[206,166,101],
    "silver":[104,106,104],
    "glimmer":[240,240,240]
}
const VariableReset = {
    "Jackpot":0,
    "Schum":0,
    "Sweet":0,
    "Bloodbath":0,
    "Fool":0,
    "Booyah":0,
    "Pizza":0,
    "Die":0,
    "Deadweight":0,
    "Sundae":0,
    "Power":0,
    "Streak":0
}
let Variables = {...VariableReset}
let SETS={
    blockIdSet:new Set(),
    trackIdSet:new Set(),
    condIdSet:new Set(),
    outputIdSet:new Set(),
    visualizerIdSet:new Set()
}
let StopDebouncer=false
class Script
{
    /**
     * The entire programmable process.  Handles the screen reading.
     */
    #currentPriority
    #selectedScreen
    constructor(LeagueDir,SelectedScreen,pixelmatch){
        /**
         * @type {Block[]}
         */
        this.Blocks = []
        this.scanningThread
        this.heartbeat=5
        this.leagueDir=LeagueDir
        this.#selectedScreen=SelectedScreen
        Pixelmatch=pixelmatch
    }
    scaleCoord(coord,screenDimensions)
    {
        const centerX = screenDimensions.x/2
        const centerY = screenDimensions.y/2
        let scaledX = centerX + (coord.x-centerX)*this.scaleFactor
        let scaledY = centerY+(coord.y-centerY)*this.scaleFactor
        scaledX = scaledX.clamp(0,screenDimensions.x)
        scaledY = scaledY.clamp(0,screenDimensions.y)
        return {x:Math.round(scaledX),y:Math.round(scaledY)}
    }
    getLeagueDir()
    {
        return this.leagueDir
    }
    getSelectedScreen()
    {
        return this.#selectedScreen
    }
    changeLeagueDir(LeagueDir)
    {
        if(this.leagueDir)fs.unwatchFile(path.join(this.leagueDir,"Config","PersistedSettings.json"))
        this.leagueDir=LeagueDir
        let data = fs.readFileSync(path.join(this.leagueDir,"Config","PersistedSettings.json"))
        this.scaleFactor=JSON.parse(data).files[0].sections[5].settings[16].value
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"scaleFactor: ",this.scaleFactor);
        fs.watchFile(path.join(this.leagueDir,"Config","PersistedSettings.json"),()=>{this.updateScaleFactor()})
    }
    /**
     * 
     * @deprecated
     */
    changeSelectedScreen(screen)
    {
        //this.stopScanning()
        this.#selectedScreen=screen
    }
    /**
     * @param {Block} block 
     */
    addBlock(block)
    {
        this.Blocks.push(block)
    }
    /**
     * @param {number} Index Index to remove from
     */
    removeBlock(UUID)
    {
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"UUID: ",UUID);
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"this.blocks: ",this.Blocks);
        this.Blocks=this.Blocks.filter(Block=>Block.UUID!==UUID)
    }

    async updateScaleFactor()
    {
        try {
            let data = fs.readFileSync(path.join(this.leagueDir,"Config","PersistedSettings.json"))
            // this.scaleFactor = 1-JSON.parse(data).files[0].sections[5].settings[16].value * 0.0445
            this.scaleFactor=JSON.parse(data).files[0].sections[5].settings[16].value
            // let TESTING = interpolate(ScanningAbilityBorderLocations[""+this.#selectedScreen.size.height][th])
            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"scaleFactor: ",this.scaleFactor);
            for(let x=0;x<this.Blocks.length;x++)
            {
                let Block = this.Blocks[x]
                if (Block.blockType=="image-scan"){
                    if(Block.scanType=="pixel"){
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Calculating coordinate for pixel-scan");
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"scaleFactor: ",this.scaleFactor);
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block.scanLocation: ",Block.scanLocation);
                        let ScanDimensions = ScanningAbilityBorderLocations[Block.spellSlot][""+this.#selectedScreen.size.height][Block.scanLocation]
                        let interpCoords = interpolate({x:ScanDimensions.MinX,y:ScanDimensions.MinY},{x:ScanDimensions.MaxX,y:ScanDimensions.MaxY},this.scaleFactor)
                        interpCoords={X:Math.floor(interpCoords.X),Y:Math.floor(interpCoords.Y)}
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Interpolation coords: ",interpCoords);
                        Block.targetLocation=interpCoords
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block.targetLocation: ",Block.targetLocation);
                        if (Block.targetLocation.X==undefined||Block.targetLocation.Y==undefined){
                            console.error("Block.targetLocation failed! Values are not valid!")
                            throw new Error("Block.targetLocation failed! Values are not valid!")
                        }
                    }else if (Block.scanType=="image"){
                        if(Block.spellSlot<5){
                            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Calculating regions and buffers for image-scan");
                            let ScanDimensions = ScanningPictureRegions[(Block.spellSlot)][""+this.#selectedScreen.size.height]
                            let interpCoords = interpolate({x:ScanDimensions.MinX,y:ScanDimensions.MinY},{x:ScanDimensions.MaxX,y:ScanDimensions.MaxY},this.scaleFactor)
                            interpCoords={X:Math.floor(interpCoords.X),Y:Math.floor(interpCoords.Y)}
                            let scaledDimension = Math.floor(Lerp(ScanDimensions.MinScale,ScanDimensions.MaxScale,this.scaleFactor))
                            let Result = await PictureToBuffer(Block.ScanImagePath)
                            Block.ScanImageBuffer = Result
                            Block.targetLocation=interpCoords
                            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block.targetLocation: ",Block.targetLocation);
                            if (Block.targetLocation.X==undefined||Block.targetLocation.Y==undefined){
                                console.error("Block.targetLocation failed! Values are not valid!")
                                throw new Error("Block.targetLocation failed! Values are not valid!")
                            }
                            Block.ScanWidth=scaledDimension
                            Block.ScanHeight=scaledDimension
                        }else if (Block.spellSlot==5){
                            //handle buffs scans here
                        }else{
                            //handle custom scans here
                        }
                    }
                    else{
                        Block.targetLocation={X:Block.scanCustomLocation[0],Y:Block.scanCustomLocation[1]}
                    }
                }
                (Block.scanColorType=="custom")?Block.targetColor=hexToRGB(Block.scanColorCustomRGB):Block.targetColor=ColorPresets[Block.scanColorType]
            
            }
        } catch (error) {
            console.log("error: ",error);
            return;
        }
    }
    
    checkImageScan(Block,bIsTesting,BlockIndex){
        
        // let Block = this.Blocks[BlockIndex]
        let conditionMet=false
        //if(Block.status=="playing"&&(Block.output=="stop-prevent-and-play"||Block.output=="stop-prevent-and-play-all"))PreventIndex=BlockIndex;
        if(!bIsTesting&&Block.startStatus=="playing"&&!Block.Started)
        {
            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK STARTS ACTIVE");
            console.log("Block.status: ",Block.status);
            
            // conditionMet=true;
            // Block.Started=true;
            return Promise.resolve(true)
            // return true;
        }
        if(bIsTesting||(Block.status=="scanning"&&Block.blockType=="image-scan"))
        {
            if(Block.spellSlot<5){
                if(Block.scanType=="pixel")
                {
                    if(bIsTesting){
                        let ColorAtPixel = getPixelColor(Block.targetLocation)
                        let totalDifference = 0;
                        const maxDifference = 255 * Block.targetColor.length;
                        for (let i = 0; i < Block.targetColor.length; i++) {
                            totalDifference += Math.abs(Block.targetColor[i] - ColorAtPixel[i]);
                        }
                        const Confidence = 1 - totalDifference / maxDifference;
                        let DataArray={
                            ScanLocation:Block.targetLocation,
                            TargetColor:Block.targetColor,
                            FoundColor:ColorAtPixel,
                            ConfidenceNeeded:Block.confidence,
                            CurrentConfidence:Confidence,
                            DidPrioritySucceed:Confidence >= Block.confidence
                        }
                        console.log("Data Array: ",DataArray);
                        fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(DataArray,null," "))
                    }else{
                        try {
                            console.log("Block.targetLocation: ",Block.targetLocation);
                            if (Block.targetLocation.X==undefined||Block.targetLocation.Y==undefined){
                                console.error("Block.targetLocation failed! Values are not valid!")
                                throw new Error("Block.targetLocation failed! Values are not valid!")
                            }
                            let ColorAtPixel = getPixelColor(Block.targetLocation)
                            conditionMet = isWithinConfidence(Block.targetColor,ColorAtPixel,Block.confidence) 
                            if(conditionMet)if(bIsVerboseLogging)Log(ErrorParse(new Error()),"IMAGE CONDITION MET");
                            return Promise.resolve(conditionMet)
                        } catch (error) {
                            console.error("Error: ",error)
                        }
                    }
                }else if(Block.scanType=="image"){
                    //Do image scanning tech for icons
                    // console.log("Block.TargetLocation: ",Block.targetLocation);
                    // console.log("Block.ScanWidth and Block.ScanHeight: ",Block.ScanWidth,Block.ScanHeight );
                    if (bIsTesting) {
                        console.log("Block.ScanImageBuffer: ",Block.ScanImageBuffer);
                        
                        sharp(Block.ScanImageBuffer, {raw: {width: 64,height: 64,channels: 4}})
                            .toFormat('png')
                            .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"TemplateImage.png"))
                            .then(() => {
                                CaptureRegionToBuffer(Block.targetLocation.X,Block.targetLocation.Y,Block.ScanWidth,Block.ScanHeight).then((ImageCaptureBuffer)=>{
                                    sharp(ImageCaptureBuffer,{raw:{width:64,height:64,channels:4}})
                                    .toFormat("png")
                                    .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"CapturedImage.png"))
                                    .then(()=>{
                                        const diff = Buffer.alloc(ImageCaptureBuffer.length)
                                        const NumOfMismatch = Pixelmatch(Block.ScanImageBuffer,ImageCaptureBuffer,diff,64,64,{diffMask:true,threshold: Threshold})
                                        let Similarity = 1-getAlpha(NumOfMismatch,0,4096)
                                        sharp(diff, { raw: { width: 64, height: 64, channels: 4 } })
                                            .toFormat("png")
                                            .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ComparisonScan.png"))
                                            .then(() => {
                                                let DataArray={
                                                    ScanLocation:Block.targetLocation,
                                                    ScanDimensions:{Width:Block.ScanWidth,Height:Block.ScanHeight},
                                                    ConfidenceNeeded:Block.confidence,
                                                    CurrentConfidence:Similarity,
                                                    DidPrioritySucceed:Similarity >= Block.confidence
                                                }
                                                console.log("Data Array: ",DataArray);
                                                fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(DataArray,null," "))
                                            })
                                            .catch((err) => console.error("Error saving diff image:", err));
                                    })
                                    .catch(error=>{console.error("Error saving capture image: ",error);
                                    })
                                })
                            })
                            .catch((err) => {
                              console.error('Error saving PNG:', err);
                            });
                    } else {
                        return CaptureRegionToBuffer(Block.targetLocation.X,Block.targetLocation.Y,Block.ScanWidth,Block.ScanHeight).then((ImageCaptureBuffer) =>{
                            conditionMet=CompareImageBuffers(Block.ScanImageBuffer,ImageCaptureBuffer,Block.confidence)
                            if(conditionMet)if(bIsVerboseLogging)Log(ErrorParse(new Error()),"IMAGE CONDITION MET");
                            return conditionMet;
                        })
                    }
                }
            }else if(Block.spellSlot==5){
                //do image scanning tech for buffs
                console.log("BLOCK WANTS BUFF SCANNING");
                
            }else{
                //do image scanning for custom location
                console.log("BLOCK WANTS CUSTOM SCANNING");
            }
        }
        return Promise.resolve(conditionMet)
    }

    
    doOutputs(Block,BlockIndex,PreventIndex,window){
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"DOING OUTPUTS");
        if(PreventIndex>BlockIndex){
            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"STOPPED BY PREVENTATIVE INDEX: ",PreventIndex);
            return PreventIndex
        }
        for(let x=0;x<Block.outputArray.length;x++){
            let Stop=false;
            let Play,PlayAll,Prevent,Add,Sub,Set=false
            let output=Block.outputArray[x]
            switch (output.cmd) {
                case "stop":
                    Stop=true;
                    break;
                case "play":
                    Play=true;
                    break;
                case "play-all":
                    PlayAll=true;
                    break;
                case "prevent":
                    Prevent=true;
                    break;
                case "add":
                    Add=true;
                    break;
                case "sub":
                    Sub=true;
                    break;
                case "set":
                    Set=true;
                    break;
                default:
                    throw new Error("Output type isn't valid")
                    break;
            }
            if(Block.status=="scanning"||(Block.Started==false&&Block.startStatus=="playing"))
            { 
                if(Block.Started==false&&Block.startStatus=="playing")Block.Started=true;
                if(Stop){
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"ATTEMPTING TO STOP MUSIC");
                    for(let y=BlockIndex;y>=0;y--){
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"STOPPING ALL TRACKS");
                        this.Blocks[y].stopAllTracks();
                    }
                }else{
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"TRACK NOT DESIGNED TO STOP OTHER MUSIC");
                }
                if(Prevent){
                    if(BlockIndex>=PreventIndex){
                        if(bIsVerboseLogging){
                            Log(ErrorParse(new Error()),"SETTING PREVENTATIVE INDEX");
                            PreventIndex=BlockIndex;
                        }
                    }
                    Block.PreventCallback=()=>{
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"PreventCallback called");
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block.status: ",Block.status);
                        if(Block.status!="playing")PreventIndex=0;
                    }
                }
                if(Play||PlayAll){
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK SWITCHED TO PLAYING");
                    // Block.changeStatus("playing");
                    if(PlayAll)
                    {
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"PLAYING ALL TRACKS");
                        for(let x=0;x<Block.Tracks.length;x++)Block.Tracks[x].playTrack();
                    }else{
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"PLAYING TRACK");
                        if(Block.Tracks.length>0)
                        {
                            if(Block.bUseVisualizer)window.send("inbound-settings",{bFillVisualizer:Block.bFillVisualizer,VisualizerFillColor:Block.VisualizerFillColor,VisualizerLineColor:Block.VisualizerLineColor,VisualizerFillPatternPath:Block.VisualizerFillPatternPath})
                            StopDebouncer=true
                            Block.Tracks[(Block.bIsRandom)?Math.floor(Math.random()*Block.Tracks.length):Block.TrackIndex].playTrack(Block.bUseVisualizer,window)
                            StopDebouncer=false
                            Block.TrackIndex++;
                            if(Block.TrackIndex>(Block.Tracks.length-1))Block.TrackIndex=0;  
                        }else{
                            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"NO TRACKS FOUND. SKIPPING");
                        }
                    }
                }else{
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK NOT DESIGNED FOR PLAYING");
                }
                if(Add){
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK SWITCHED TO PLAYING. Adding Value");
                    // Block.changeStatus("playing");
                    Variables[output.stack]+=output.value;
                    if(mainWindow)mainWindow.send("UpdateValues",{Variables:Variables})
                }
                if(Sub){
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK SWITCHED TO PLAYING. Subtracting value");
                    // Block.changeStatus("playing");
                    Variables[output.stack]-=output.value;
                    if(mainWindow)mainWindow.send("UpdateValues",{Variables:Variables})
                }
                if(Set){
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK SWITCHED TO PLAYING. Setting value");
                    // Block.changeStatus("playing");
                    Variables[output.stack]=output.value;
                    if(mainWindow)mainWindow.send("UpdateValues",{Variables:Variables})
                }

            } else{
                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK WAS ALREADY ACTIVE/DISABLED: ",Block.status);
            }
        }
        Block.changeStatus("playing");
        return PreventIndex
    }
    async startScanning(window,MainWindow)
    {
        mainWindow=MainWindow;
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Begin scanning");
        if(mainWindow){
            let Blocks=[]
            for(let x=0;x<this.Blocks.length;x++){
                let Block = {UUID:this.Blocks[x].UUID,status:this.Blocks[x].status}
                Blocks.push(Block)
            }
            mainWindow.send("UpdateValues",{Blocks:Blocks,Variables:Variables})
        }
        if (this.scanningThread)clearInterval(this.scanningThread);
        //calculate the required pixel coords, if applicable
        await this.updateScaleFactor()
        let PreventIndex=0
        this.scanningThread = setInterval(()=>{
            //iterate through each block, and get the coord
            //insert evil ass rape scanner
            for(let BlockIndex=this.Blocks.length-1;BlockIndex>=0;BlockIndex--){
                let Block = this.Blocks[BlockIndex]
                // let conditionMet=false
                //if(Block.status=="playing"&&(Block.output=="stop-prevent-and-play"||Block.output=="stop-prevent-and-play-all"))PreventIndex=BlockIndex;
                // if(Block.startStatus=="playing"&&!Block.Started)
                // {
                //     if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK STARTS ACTIVE");
                //     conditionMet=true;
                //     Block.Started=true;
                // }
                // if(Block.status=="scanning"&&Block.blockType=="image-scan")
                // {
                //     if(Block.scanType=="pixel")
                //     {
                //         if(Block.spellArea=="border")
                //         {
                //             //Do image scanning
                //             console.log("Block.TargetLocation: ",Block.targetLocation);
                //             let TargetCoordinates = {x:Block.targetLocation.X,y:Block.targetLocation.Y}
                //             console.log("Target Coordinates: ",TargetCoordinates);
                //             let ColorAtPixel = getPixelColor(TargetCoordinates)
                //             conditionMet = isWithinConfidence(Block.targetColor,ColorAtPixel,Block.confidence) 
                //             if(conditionMet)if(bIsVerboseLogging)Log(ErrorParse(new Error()),"IMAGE CONDITION MET");
                            
                //         }else if(Block.spellArea=="icon")
                //         {
                //             //Do image scanning tech for icon
                //         }
                //     }else if(Block.scanType=="image"){
                //         //Do image scanning tech
                //     }
                // }
                console.log("BlockIndex: ",BlockIndex);
                
                // console.log("Block: ",Block);
                
                this.checkImageScan(Block).then(result=>{
                    if(result)
                    {
                        PreventIndex=this.doOutputs(Block,BlockIndex,PreventIndex,window)
                    }else{
                        // if(bIsVerboseLogging)Log(ErrorParse(new Error()),"CONDITION WAS NOT MET");
                    }
                })
                //TODO CHECK CONDITIONALS
                //if(bIsVerboseLogging)Log(ErrorParse(new Error()),"block: ",Block.conditionalArray);
                for(let z=0;z<Block.conditionalArray.length;z++){
                    let Cond = Block.conditionalArray[z]
                    let ConditionalMet=false
                    switch (Cond.condOperator) {
                        case "==":
                            if(Variables[Cond.condStack]==Cond.condInput)ConditionalMet=true;
                            break;
                        case ">=":
                            if(Variables[Cond.condStack]>=Cond.condInput)ConditionalMet=true;
                            break;
                        case "<=":
                            if(Variables[Cond.condStack]<=Cond.condInput)ConditionalMet=true;
                            break;
                        case "<":
                            if(Variables[Cond.condStack]<Cond.condInput)ConditionalMet=true;
                            break;
                        case ">":
                            if(Variables[Cond.condStack]>Cond.condInput)ConditionalMet=true;
                            break;
                    }
                    if (ConditionalMet){
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"CONDITION HAS BEEN MET IN CONDITIONAL ARRAY");  
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block.Status: ",Block.status);
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Cond.condOutput: ",Cond.condOutput);
                        if(PreventIndex<=BlockIndex)
                        {
                            // if(bIsVerboseLogging)Log(ErrorParse(new Error()),"block: ",Block.status);
                            if(Block.status!="playing"){if(bIsVerboseLogging)Log(ErrorParse(new Error()),"BLOCK IS NO LONGER ACTIVE");}
                            if(Block.status=="playing"&&Cond.condOutput!="playing"){
                                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"STOP THAT SHIT RN");   
                                Block.stopAllTracks()
                            }else if(Block.status!="playing"&&Cond.condOutput=="playing"){
                                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"PLAY THAT SHIT RN");
                                if(Block.bUseVisualizer)window.send("inbound-settings",{bFillVisualizer:Block.bFillVisualizer,VisualizerFillColor:Block.VisualizerFillColor,VisualizerLineColor:Block.VisualizerLineColor,VisualizerFillPatternPath:Block.VisualizerFillPatternPath})
                                this.doOutputs(Block,BlockIndex,PreventIndex,window)
                            }else if(Block.status!=Cond.condOutput)
                            {
                                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Block.Status: ",Block.status);
                                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Cond.condOutput: ",Cond.condOutput);
                                Block.status==Cond.condOutput
                            }else{
                                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"SOMETHING IS SERIOUSLY WRONG WITH THE CONDITIONAL LOGIC!!");
                            }
                        }else{
                            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"ACTION STOPPED DUE TO PREVENTION");
                        }
                    }
                }
            }
        },this.heartbeat)
    }
    stopScanning()
    {
        //stop all music
        //reset all blocks to default value
        for(let x=0;x<this.Blocks.length;x++)
        {
            let Block = this.Blocks[x]
            Block.stopAllTracks()
            Block.status=Block.startStatus
            Block.Started=false;
        }
        //reset all vars to default values
        Variables = {...VariableReset}
        // console.log("VariableReset: ",VariableReset);
        // console.log("Variables: ",Variables);
        if(mainWindow){
            let Blocks=[]
            for(let x=0;x<this.Blocks.length;x++){
                let Block = {UUID:this.Blocks[x].UUID,status:this.Blocks[x].status}
                Blocks.push(Block)
            }
            mainWindow.send("UpdateValues",{Blocks:Blocks,Variables:Variables})
        }
        if (this.scanningThread)clearInterval(this.scanningThread);
        this.scanningThread=undefined
    }

    /**
     * @returns {{data}}
     */
    toJSON(){
        return {
            LeagueDir:this.leagueDir,
            SelectedScreen:this.#selectedScreen,
            heartbeat:this.heartbeat,
            Blocks:this.Blocks.map((item)=>{
                //if(bIsVerboseLogging)Log(ErrorParse(new Error()),"item: ",item);
                return item.toJSON()
            })
        }
    }
    /**
     * 
     * @param {{data}} data 
     */
    parseJSON(data)
    {
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Data saved: ",data);
        if(data&&data.currentPriority)this.currentPriority = data.currentPriority;
        if(data&&data.heartbeat)this.heartbeat = data.heartbeat;
        if(data&&data.LeagueDir)this.changeLeagueDir(data.LeagueDir)
        if(data&&data.Blocks&&data.Blocks.length>0)
        {
            data.Blocks.forEach(element => {
                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"element: ",element);
                let NewBlock = new Block(element)
                if(element.Tracks&&element.Tracks.length>0)
                {
                    element.Tracks.forEach((TrackValue)=>{
                        let NewTrack = new Track(TrackValue.TrackURL)
                        NewBlock.addTrack(NewTrack)
                    })
                }
                this.addBlock(NewBlock)
            });
        }
    }
}
//A segment of the process. Can only have 7 Blocks, each representing a priority over each other
class Block
{
    constructor(options){
        this.UUID = generateUUID("blockIdSet")
        this.bIsFadeIn =(options&&options.bIsFadeIn)?options.bIsFadeIn:false;
        this.FadeInDuration =(options&&options.FadeInDuration)?options.FadeInDuration:1;
        this.bIsFadeOut = (options&&options.bIsFadeOut)?options.bIsFadeOut:false;
        this.FadeOutDuration =(options&&options.FadeOutDuration)?options.FadeOutDuration:1;
        this.bIsRandom = (options&&options.bIsRandom)?options.bIsRandom:false;
        this.blockType=(options&&options.blockType)?options.blockType:"image-scan";
        this.status = (options&&options.startStatus)?options.startStatus:"scanning"
        this.startStatus=(options&&options.startStatus)?options.startStatus:"scanning"
        this.bShouldInterrupt = (options&&options.interrupt)?options.bShouldInterrupt:true;
        this.spellSlot = (options&&options.spellSlot)?options.spellSlot:4;
        this.scanLocation = (options&&options.scanLocation)?options.scanLocation:"border-start";
        this.scanCustomLocation =(options&&options.scanCustomLocation)?options.scanCustomLocation:[]//X,Y
        this.targetLocation
        this.scanColorType = (options&&options.scanColorType)?options.scanColorType:"yellow";
        this.scanColorCustomRGB=(options&&options.scanColorCustomRGB)?options.scanColorCustomRGB:"#000000"
        this.targetColor
        this.confidence = (options&&options.confidence)?options.confidence:0.7;
        this.Tracks = []
        this.TrackIndex=0
        this.bUseVisualizer=(options&&options.bUseVisualizer)?options.bUseVisualizer:false
        this.VisualizerLineColor=(options&&options.VisualizerLineColor)?options.VisualizerLineColor:"#2FD4E3"
        this.bFillVisualizer=(options&&options.bFillVisualizer)?options.bFillVisualizer:false
        this.VisualizerFillColor=(options&&options.VisualizerFillColor)?options.VisualizerFillColor:"#2FD4E3"
        this.outputArray=(options&&options.outputArray)?options.outputArray:[]
        if(this.outputArray.length>0)this.outputArray.forEach(element=>element.UUID=generateUUID("outputIdSet",element.UUID))
        this.conditionalArray=(options&&options.conditionalArray)?options.conditionalArray:[];
        if(this.conditionalArray.length>0)this.conditionalArray.forEach(element=>element.UUID=generateUUID("condIdSet",element.UUID))
        this.scanType=(options&&options.scanType)?options.scanType:"pixel";
        this.spellArea=(options&&options.spellArea)?options.spellArea:"border";
        this.Started=false;
        this.VisualizerFillPatternPath=(options&&options.VisualizerFillPatternPath)?options.VisualizerFillPatternPath:"";
        this.ScanImagePath=(options&&options.ScanImagePath)?options.ScanImagePath:""
        this.ScanImageBuffer;
        this.ScanWidth,
        this.ScanHeight,
        this.PreventCallback;
    }
    changeStatus(newStatus)
    {
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"old status: ",this.status);
        this.status=newStatus
        let Blocks=[{UUID:this.UUID,status:this.status}]
        mainWindow.send("UpdateValues",{Blocks:Blocks})
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"new status: ",this.status);
        if(this.PreventCallback)this.PreventCallback()
    }
    checkStatus(){
        for(let x=0;x<this.Tracks.length;x++){
            if(this.Tracks[x].status!="inactive")return;
        }
        this.changeStatus("scanning")
    }
    stopAllTracks()
    {
        if(this.Tracks.length>0){
            this.Tracks.forEach((element)=>{
                element.stopTrack()
            })
        }
        this.checkStatus()
    }
    /**
     * @param {Track} track 
     */
    addTrack(track)
    {
        //All tracks are urls, so ensure no dupe URLS
        for(let x=0;x<this.Tracks.length;x++)
        {
            if(this.Tracks[x].TrackURL===track.TrackURL)return;
        }
        track.ParentBlock = this;
        this.Tracks.push(track)
    }
    /**
     * @param {number} Index 
     */
    removeTrack(UUID)
    {
        this.Tracks=this.Tracks.filter(track=>track.UUID!==UUID)
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"this.Tracks: ",this.Tracks);
    }
    toJSON(){
        return{
            bIsFadeIn:this.bIsFadeIn,
            FadeInDuration:this.FadeInDuration,
            bIsFadeOut:this.bIsFadeOut,
            FadeOutDuration:this.FadeOutDuration,
            bIsRandom:this.bIsRandom,
            bShouldInterrupt:this.bShouldInterrupt,
            spellSlot:this.spellSlot,
            scanColorType:this.scanColorType,
            scanColorCustomRGB:this.scanColorCustomRGB,
            scanCustomLocation:this.scanCustomLocation,
            scanLocation:this.scanLocation,
            confidence:this.confidence,
            // output:this.output,
            startStatus:this.startStatus,
            blockType:this.blockType,
            outputArray:this.outputArray,
            // outputStack:this.outputStack,
            // outputModifier:this.outputModifier,
            ScanImagePath:this.ScanImagePath,
            conditionalArray:this.conditionalArray,
            scanType:this.scanType,
            spellArea:this.spellArea,
            bUseVisualizer:this.bUseVisualizer,
            VisualizerLineColor:this.VisualizerLineColor,
            bFillVisualizer:this.bFillVisualizer,
            VisualizerFillColor:this.VisualizerFillColor,
            VisualizerFillPatternPath:this.VisualizerFillPatternPath,
            Tracks:this.Tracks.map((item)=>{
                return item.toJSON()
            })
        }
    }
}
//A audio segment within a block
class Track
{
    constructor(TrackURL,ParentBlock)
    {
        this.UUID=generateUUID("trackIdSet")
        this.Source
        this.GainNode
        this.TrackURL=TrackURL
        this.status="inactive"
        this.ParentBlock=ParentBlock
        this.FadeOutThread
        this.TrackDuration=0
        this.visualizerWindow
        this.ThreadBusy=false
    }
    toJSON(){
        return{
            TrackURL:this.TrackURL
        }
    }
    stopTrack()
    {
        function realStop(Self)
        {
            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Stopping track...");
            console.log("Song: ",Self.TrackURL);
            if(Self.status=="inactive")if(bIsVerboseLogging){Log("Track is inactive. Skipping");return;}
            if(Self.ParentBlock.bIsFadeOut)
            {
                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Fadding out...");
                AsyncTween(Self.GainNode,1,0,Self.ParentBlock.FadeOutDuration*1000).then(()=>{
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Song over?");
                    try {
                        Self.Source.stop();
                        Self.Source.disconnect();
                    } catch (error) {
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Source hasnt started yet");
                    }
                    Self.status="inactive"
                    Self.ParentBlock.checkStatus()
                    // this.ParentBlock.status="scanning"
                    if(Self.FadeOutThread)clearTimeout(Self.FadeOutThread);
                    if(Self.VisualizerThread){
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"stopping visualizer");
                        clearInterval(Self.VisualizerThread);
                        Self.VisualizerThread=undefined;
                        Self.visualizerWindow.send("stop-visualizer")
                    }
                    Self.FadeOutThread=undefined;
                    Self.GainNode=undefined;
                    Self.Source=undefined;
                    Self.VisualizerThread=undefined;
                })
            }else{
                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Hard stopping");
                try {
                    Self.Source.stop();
                    Self.Source.disconnect();
                } catch (error) {
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Source hasnt started yet");
                }
                Self.status="inactive"
                Self.ParentBlock.checkStatus()
                // this.ParentBlock.status="scanning"
                if(Self.FadeOutThread)clearTimeout(Self.FadeOutThread);
                if(Self.VisualizerThread){if(bIsVerboseLogging)Log(ErrorParse(new Error()),"stopping visualizer");
                    clearInterval(Self.VisualizerThread);Self.VisualizerThread=undefined;}
                Self.FadeOutThread=undefined;
                Self.GainNode=undefined;
                Self.Source=undefined;
                Self.VisualizerThread=undefined;
            }
        }
        if(this.ThreadBusy){
            let stoppingThread=setInterval(() => {
                if(!this.ThreadBusy)realStop(this);clearInterval(stoppingThread);
            }, 500);
        }else{
            realStop(this)
        }
    }
    playTrack(bUseVisualizer,visualizerWindow)
    {
        this.ThreadBusy=true   
        const audioContext = new AudioContext()
        getBuffer(audioContext,this.TrackURL).then((audioBuffer)=>{
            this.Source = audioContext.createBufferSource();
            this.Source.buffer = audioBuffer 
            this.GainNode = audioContext.createGain()
            this.GainNode.gain.value=1.0
            this.Source.connect(this.GainNode)
            this.visualizerWindow=visualizerWindow
            if(bUseVisualizer&&visualizerWindow){
                const analyser = audioContext.createAnalyser()
                this.Source.connect(analyser)
                analyser.fftSize=2048;
                if(this.VisualizerThread){clearInterval(this.VisualizerThread);this.VisualizerThread=undefined;}
                visualizerWindow.setAlwaysOnTop(true,"screen-saver",1);
                visualizerWindow.setFullScreenable(false);
                visualizerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                // Below statement completes the flow
                let UUID = generateUUID("visualizerIdSet")
                this.VisualizerThread=setInterval(()=>{
                    if (!visualizerWindow.isFocused()) {
                        visualizerWindow.focus();
                    }
                    visualizerWindow.moveTop();
                    // visualizerWindow.focus()
                    const frequencyData = new Uint8Array(analyser.frequencyBinCount)
                    analyser.getByteFrequencyData(frequencyData)
                    let Frequencies = Array.from(frequencyData)
                    let flipped = Frequencies.slice().reverse()
                    let concat = flipped.concat(Frequencies)
                    const reducedData = downsampleFrequencyData(concat, 64);
                    // const SmoothData =smoothData(reducedData,1)
                    const ExaggeratedValue = exaggerate(reducedData,3,2)
                    if(visualizerWindow)
                    {
                        visualizerWindow.send("inbound-frequency",ExaggeratedValue,UUID)
                    }
                },1)
            }
            this.GainNode.connect(audioContext.destination)
            this.TrackDuration = getTrackLength(audioContext,this.TrackURL).then(TrackDuration=>{
                this.TrackDuration=TrackDuration
                this.Source.start()
                if(this.ParentBlock.bIsFadeIn&&this.ParentBlock.FadeInDuration<=this.TrackDuration)
                {
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Fading in...");
                    this.GainNode.gain.value=0
                    AsyncTween(this.GainNode,0,1,this.ParentBlock.FadeInDuration*1000)
                }
            this.status="active"
            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"this.status: ",this.status);
            this.Source.onended = ()=>{
                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"song ended");
                this.status="inactive"
                this.ParentBlock.checkStatus()
                if(this.FadeOutThread)clearTimeout(this.FadeOutThread);
                this.FadeOutThread=undefined;
                this.GainNode=undefined;
                this.Source=undefined;
            }
            if(this.ParentBlock.bIsFadeOut&&this.ParentBlock.FadeOutDuration<=this.TrackDuration)
            {
                if(bIsVerboseLogging)Log(ErrorParse(new Error()),"FADING SONG OUT IN ",(this.TrackDuration-this.ParentBlock.FadeOutDuration)*1000," MS")
                this.FadeOutThread = setTimeout(()=>{
                    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"FADING SONG OUT")
                    AsyncTween(this.GainNode,1,0,this.ParentBlock.FadeOutDuration*1000).then(()=>{
                        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Song over?");
                        try {
                            Self.Source.stop();
                            Self.Source.disconnect();
                        } catch (error) {
                            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Source hasnt started yet");
                        }
                        Self.status="inactive"
                        Self.ParentBlock.checkStatus()
                        // this.ParentBlock.status="scanning"
                        if(Self.FadeOutThread)clearTimeout(Self.FadeOutThread);
                        if(Self.VisualizerThread){
                            if(bIsVerboseLogging)Log(ErrorParse(new Error()),"stopping visualizer");
                            clearInterval(Self.VisualizerThread);
                            Self.VisualizerThread=undefined;
                            Self.visualizerWindow.send("stop-visualizer")
                        }
                        Self.FadeOutThread=undefined;
                        Self.GainNode=undefined;
                        Self.Source=undefined;
                        Self.VisualizerThread=undefined;
                    })
                },(this.TrackDuration-this.ParentBlock.FadeOutDuration)*1000)
            }
            this.ThreadBusy=false
            return
            })
        })
    }
}
async function getTrackLength(audioContext,filePath)
{
    let bufferInfo
    switch (path.extname(path.join(filePath)).toLowerCase())
    {
        case ".mp3":
        const decoder = new Lame({
            output: "buffer"
        }).setFile(path.join(filePath));
        await decoder.decode()
        // Decoding finished
        buffer = decoder.getBuffer();
        bufferInfo= await audioContext.decodeAudioData(buffer.buffer)
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"duration: ", bufferInfo.duration);
        return bufferInfo.duration
        case ".wav":
        buffer = fs.readFileSync(path.join(filePath))
        bufferInfo = await audioContext.decodeAudioData(buffer.buffer)
        if(bIsVerboseLogging)Log(ErrorParse(new Error()),"duration: ", bufferInfo.duration);
        return bufferInfo.duration
    }
}
async function getBuffer(audioContext,filePath)
{
    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Audio Path: ",path.join(filePath));
    
    switch (path.extname(path.join(filePath)).toLowerCase())
    {
        case ".mp3":
        const decoder = new Lame({
            output: "buffer"
        }).setFile(path.join(filePath));
        await decoder.decode()
        // Decoding finished
        buffer = decoder.getBuffer();
        return await audioContext.decodeAudioData(buffer.buffer)
        case ".wav":
        buffer = fs.readFileSync(path.join(filePath))
        return await audioContext.decodeAudioData(buffer.buffer)
    }
}

async function AsyncTween(audioNode, startVolume, endVolume, duration) {
    const stepTime = 10; // Interval time in ms
    const totalSteps = duration / stepTime;
    const volumeStep = (endVolume - startVolume) / totalSteps;
    for (let step = 0; step <= totalSteps; step++) {
        const currentVolume = startVolume + volumeStep * step;
        audioNode.gain.value = currentVolume; // Set volume
        await new Promise((resolve) => setTimeout(resolve, stepTime)); // Wait for the step interval
    }
}
function generateUUID(Channel,OptionalInput)
{
    let id;
    if(OptionalInput&&!(SETS[Channel].has(OptionalInput))){SETS[Channel].add(OptionalInput);return OptionalInput;}
    do{
        id=Math.floor(Math.random()*1e6)
    }while(SETS[Channel].has(id))
    SETS[Channel].add(id)
    return id;
}
function downsampleFrequencyData(data, targetLength) {
    let downsampled = [];
    const step = Math.floor(data.length / targetLength);
    for (let i = 0; i < targetLength; i++) {
        const start = i * step;
        const end = Math.min(start + step, data.length);
        const average = data.slice(start, end).reduce((sum, val) => sum + val, 0) / (end - start);
        downsampled.push(Math.floor(average));
    }
    downsampled=downsampled.filter(value=>value!==0)
    return downsampled;
}
function exaggerate(frequencyData, exaggerationLevel = 1.5, scale = 1) {
    return frequencyData.map(value => {
        // Apply power-based exaggeration
        let exaggeratedValue = Math.pow(value / 255, exaggerationLevel) * 255;

        // Optionally scale the result
        exaggeratedValue *= scale;

        // Clamp to a maximum of 255
        return Math.min(255, exaggeratedValue);
    });
}
function smoothData(data, smoothingFactor = 3) {
    return data.map((_, i, arr) => {
        const start = Math.max(0, i - smoothingFactor);
        const end = Math.min(arr.length - 1, i + smoothingFactor);
        const slice = arr.slice(start, end + 1);
        return slice.reduce((sum, val) => sum + val, 0) / slice.length;
    });
}
function interpolate(start,end,alpha)
{
    return {
        X: alpha * start.x + (1 - alpha) * end.x,
        Y: alpha * start.y + (1 - alpha) * end.y
    };
}
function Lerp(Value1,Value2,Alpha){
    return (1 - Alpha) * Value1 + Alpha * Value2;
}
function setLoggingState(state){
    bIsVerboseLogging=state
}
function hexToRGB(hex)
{
    hex=hex.replace("#","")
    const R=parseInt(hex.slice(0,2),16)
    const G=parseInt(hex.slice(2,4),16)
    const B=parseInt(hex.slice(4,6),16)
    return [R,G,B]
}
function ErrorParse(Error)
{
    return "["+Error.stack.split("\n")[1].trim().split(/[\\/]/).pop()+"]"
}
function getAlpha(currentValue, min, max) {
    if (currentValue < min) currentValue = min;
    if (currentValue > max) currentValue = max;
    return (currentValue - min) / (max - min);
}
function CaptureRegionToBuffer(x,y,width,height){
    const screenImage = robot.screen.capture(x,y,width,height)
    // const buffer = Buffer.alloc(pixelData.length*4);
    // const pixelData=[];
    // for(let i=0;i<screenImage.image.length;i+=4)
    // {
    // // pixelData.push({
    //     // r:screenImage.image[i]
    //     // g:screenImage.image[i+1]
    //     // b:screenImage.image[i+2]
    //     // a:screenImage.image[i+3]
    // // })
    //     const offset = i*4
    //     buffer[offset]=screenImage.image[i]
    //     buffer[offset+1]=screenImage.image[i+1]
    //     buffer[offset+2]=screenImage.image[i+2]
    //     buffer[offset+3]=screenImage.image[i+3]
    // }
    // return buffer
    return sharp(screenImage.image,{raw:{width,height,channels:4}})
        .resize(64,64)
        .raw()
        .toBuffer()
        .then((resizedBuffer)=>{
            const FixedBuffer = Buffer.alloc(resizedBuffer.length)
            for (let i=0;i<resizedBuffer.length;i+=4)
            {
                FixedBuffer[i] = resizedBuffer[i + 2];     // Red
                FixedBuffer[i + 1] = resizedBuffer[i + 1]; // Green
                FixedBuffer[i + 2] = resizedBuffer[i];     // Blue
                FixedBuffer[i + 3] = resizedBuffer[i + 3]; // Alpha
            }
            return FixedBuffer
        })
        .catch(err=>{throw err})
}
// function RGBarrayToBuffer(pixelData){
    
//     pixelData.forEach((color,index)=>{
        
//     })
//     return buffer
// }
function CompareImageBuffers(ReferenceBuffer,CaptureBuffer,confidence){
    // console.log("ReferenceBuffer: ",ReferenceBuffer);
    // console.log("CaptureBuffer: ",CaptureBuffer);
    
    
    if (ReferenceBuffer.length !== CaptureBuffer.length) {
        console.error("Buffer lengths do not match!");
        return;
    }
    const diff = Buffer.alloc(ReferenceBuffer.length)
    const NumOfMismatch = Pixelmatch(CaptureBuffer,ReferenceBuffer,diff,64,64,{diffMask:true,threshold: Threshold})
    let Similarity = 1-getAlpha(NumOfMismatch,0,4096)
    console.log("similarity: ",Similarity);
    // console.log("Num of mismatch pixels: ",NumOfMismatch);
    // console.log("Confidence: ",confidence);
    console.log("Similarity>=confidence:",Similarity>=confidence);
    
    return Similarity>=confidence
}
function PictureToBuffer(referenceImagePath){
    return sharp(path.join(referenceImagePath))
        .resize(64,64)
        .ensureAlpha()
        .raw()
        .toBuffer()
        .then((imageBuffer)=>{
            return imageBuffer
    })
}
function getPixelColor({X, Y}) {
    // console.log("this.selectedScreen: ",this.#selectedScreen);
    // console.log("Mouse pos: ",robot.getMousePos());
    
    const color = robot.getPixelColor(X, Y);
    let [r,g,b]=[parseInt(color.substring(0,2),16),parseInt(color.substring(2,4),16),parseInt(color.substring(4,6),16)];
    return [r,g,b];
}
function isWithinConfidence(Color1,Color2,Confidence)
{
    if (Color1.length !== Color2.length)throw new Error("Arrays must have the same length");
    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Color1: ",Color1);
    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Color2: ",Color2);
    let totalDifference = 0;
    const maxDifference = 255 * Color1.length;
    for (let i = 0; i < Color1.length; i++) {
        totalDifference += Math.abs(Color1[i] - Color2[i]);
    }
    const similarity = 1 - totalDifference / maxDifference;
    if(bIsVerboseLogging)Log(ErrorParse(new Error()),"Similarity: ",similarity);
    return similarity >= Confidence;        
}

module.exports={getBuffer,AsyncTween,Script,Block,Track,ScanningAbilityBorderLocations,generateUUID,setLoggingState,ErrorParse}
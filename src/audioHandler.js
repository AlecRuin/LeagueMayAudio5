const path = require("node:path")
const {Lame} = require("node-lame")
const AudioContext = require("node-web-audio-api").AudioContext
const fs = require("fs")
const robot=require("robotjs")
const sharp = require("sharp")
const {Log} = require("./logging.js")
const {app, dialog} = require("electron");
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};
let mainWindow,Pixelmatch,visualizerWindow,PreventIndex
let Threshold=0.15
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
        "720":{
            MinX:453,
            MaxX:517,
            MinY:632,
            MaxY:662,
            MaxScale:28,
            MinScale:18
        },
        "1080":{
            MaxX:775,
            MinX:681,
            MaxY:993,
            MinY:950,
            MaxScale:41,
            MinScale:28
        },
        "1440":{
            MinX:908,
            MinY:1266,
            MaxX:1034,
            MaxY:1325,
            MinScale:34,
            MaxScale:54
        }
    },{
        //Q
        "720":{
            MaxScale:38,
            MinX:487,
            MaxX:539,
            MinY:632,
            MaxY:662,
            MinScale:24
        },
        "1080":{
            MinX:731,
            MaxX:808,
            MinY:949,
            MaxY:993,
            MinScale:37,
            MaxScale:56
        },
        "1440":{
            MinX:975,
            MinY:1266,
            MaxX:1079,
            MaxY:1325,
            MaxScale:74,
            MinScale:48
        }
    },{
        //W
        "720":{
            MinX:531,
            MaxX:568,
            MinY:632,
            MaxY:662,
            MinScale:24,
            MaxScale:38
        },
        "1080":{
            MinX:798,
            MaxX:852,
            MaxY:993,
            MinY:949,
            MaxScale:55,
            MinScale:37
        },
        "1440":{
            MinY:1226,
            MinX:1064,
            MaxX:1137,
            MaxY:1325,
            MinScale:49,
            MaxScale:73
        }
    },{
        //E
        "720":{
            MinX:576,
            MaxX:589,
            MinY:632,
            MaxY:662,
            MaxScale:37,
            MinScale:24
        },
        "1080":{
            MinX:864,
            MinY:949,
            MaxX:896,
            MaxY:993,
            MinScale:37,
            MaxScale:56
        },
        "1440":{
            MinX:1153,
            MinY:1266,
            MaxX:1196,
            MaxY:1325,
            MinScale:48,
            MaxScale:73
        }
    },{
        //R
        "720":{
            MinX:620,
            MaxX:627,
            MinY:632,
            MaxY:662,
            Scale:24,
            Scale:38
        },
        "1080":{
            MaxScale:55,
            MinX:931,
            MaxX:940,
            MaxY:993,
            MinY:949,
            MinScale:37
        },
        "1440":{
            //48x48, 1255 1325
            //75x75 1241 1266
            MinX:1241,
            MinY:1266,
            MinScale:48,
            MaxX:1255,
            MaxY:1325,
            MaxScale:75
        }
    },{
        //Buffs
        "720":{
            /** 0 501,634 17x17 
             * 25 483,623 19x19
             * 50 466,612 21x21
             * 75 448,602 23x23
             * 100 430,591 25x25
             */
            XFunction:(scaleFactor)=>{
                return -0.708(scaleFactor*100)+501
            },
            YFunction:(scaleFactor)=>{
                return -0.428*(scaleFactor*100)+633.8
            },
            ScaleFunction:(scaleFactor)=>{
                return 0.08*(scaleFactor*100)+17
            },
            Settings:{
                HeightPadding:1,
                WidthPadding:1,
                width:6,
                height:3
            }
        },
        "1080":{
            //AT 0 scale: 23x23, starts at 753,897, padding 4px
            //AT 1 scale: 36x36, starts at 646,807, padding 4px
            /**0 753,951 23x23
             * 25 726,936 26x26
             * 50 700,920 29x29
             * 75 673,903 32x32
             * 100 646,887 36x36
             */ 
            XFunction:(scaleFactor)=>{
                return -1.068*(scaleFactor*100)+753
            },
            YFunction:(scaleFactor)=>{
                return -0.644*(scaleFactor*100)+951.6
            },
            ScaleFunction:(scaleFactor)=>{
                return 0.128*(scaleFactor*100)+22.8
            },
            Settings:{
                HeightPadding:3,
                WidthPadding:3,
                width:6,
                height:3
            }
        },
        "1440":{
            XFunction:(scaleFactor)=>{
                return -1.42*(scaleFactor*100)+1003.8
            },
            YFunction:(scaleFactor)=>{
                return -0.872*(scaleFactor*100)+1271.2
            },
            ScaleFunction:(scaleFactor)=>{
                return 0.168*(scaleFactor*100)+31.4
            },
            //AT 0 SCALE: 31x31, starts at 1004,1201, padding 4px. 
            //AT 1 SCALE: 48x48, starts at 862,1079, padding 4px, 6x3 cells
            //0 1004, 1271, 31x31
            //.25 968, 1250, 36x36
            //.5 933, 1227, 40x40 1271=22/35(1004)+b
            //.75 897,1206 44x44
            //1 862,1183 48x48
            //.74 899,1206, 44x44
            /**For each pair (Xi,Yi)
             * calculate (Xi-AvgX)(Yi-AvgY)+
             * square (Xi-AvgX)+
             * Covariance/Variace
             * b=AvgY-mAvgX
             */
            Settings:{
                HeightPadding:4,
                WidthPadding:4,
                width:6,
                height:3
            }
        }
    }
]
const ColorPresets ={
    "yellow":[255,251,189],
    "gold":[170,140,81],
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
    visualizerIdSet:new Set(),
    postTrackOps:new Set()
}
let StopDebouncer=false
let SexyAssScanBuffer
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
        if(pixelmatch)Pixelmatch=pixelmatch;
        else console.error("PixelMatch is missing");
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
        if(this.leagueDir&&fs.existsSync(path.join(this.leagueDir,"Config","PersistedSettings.json"))){
            let data = fs.readFileSync(path.join(this.leagueDir,"Config","PersistedSettings.json"))
            this.scaleFactor=JSON.parse(data).files[0].sections[5].settings[16].value
            Log(new Error(),"scaleFactor: ",this.scaleFactor);
            fs.watchFile(path.join(this.leagueDir,"Config","PersistedSettings.json"),()=>{this.updateScaleFactor()})
        }else Log(new Error(),"League directory is invalid");
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
        Log(new Error(),"UUID: ",UUID);
        Log(new Error(),"this.blocks: ",this.Blocks);
        this.Blocks=this.Blocks.filter(Block=>Block.UUID!==UUID)
    }

    async updateScaleFactor()
    {
        try {
            let data = fs.readFileSync(path.join(this.leagueDir,"Config","PersistedSettings.json"))
            this.scaleFactor=JSON.parse(data).files[0].sections[5].settings[16].value
            Log(new Error(),"scaleFactor: ",this.scaleFactor);
            for(let x=0;x<this.Blocks.length;x++)
            {
                let Block = this.Blocks[x]
                if (Block.blockType=="image-scan"){
                    if(Block.scanType=="pixel"){
                        if(Block.spellSlot<5){
                            Log(new Error(),"Calculating coordinate for pixel-scan");
                            Log(new Error(),"scaleFactor: ",this.scaleFactor);
                            Log(new Error(),"Block.scanLocation: ",Block.scanLocation);
                            let ScanDimensions = ScanningAbilityBorderLocations[Block.spellSlot][""+(this.#selectedScreen.size.height*this.#selectedScreen.scaleFactor)][Block.scanLocation]
                            let interpCoords = interpolate({x:ScanDimensions.MinX,y:ScanDimensions.MinY},{x:ScanDimensions.MaxX,y:ScanDimensions.MaxY},this.scaleFactor)
                            interpCoords={X:Math.floor(interpCoords.X),Y:Math.floor(interpCoords.Y)}
                            Log(new Error(),"Interpolation coords: ",interpCoords);
                            Block.targetLocation=interpCoords
                            Log(new Error(),"Block.targetLocation: ",Block.targetLocation);
                        }else if(Block.spellSlot==5){
                            Log(new Error(),"Priority is buff pixel scan");
                            //buff pixel location
                            Block.targetLocation=[]
                            let SelectedRegion =  ScanningPictureRegions[5][""+(this.#selectedScreen.size.height*this.#selectedScreen.scaleFactor)]
                            let X = Math.floor(SelectedRegion.XFunction(this.scaleFactor))
                            let Y = Math.floor(SelectedRegion.YFunction(this.scaleFactor))
                            let Scale = Math.floor(SelectedRegion.ScaleFunction(this.scaleFactor))
                            Log(new Error(),"X,Y,Scale: ",X,Y,Scale);
                            for(let y=0;y<SelectedRegion.Settings.width;y++){
                                for(let z=0;z<SelectedRegion.Settings.height;z++){
                                    Block.targetLocation.push({X:Math.floor(X+(SelectedRegion.Settings.WidthPadding*y+Scale*y)+Math.floor(Scale/1.5))+1,Y:Math.floor(Y-(SelectedRegion.Settings.HieghtPadding*z+Scale*z)+Math.floor(Scale/2.7))-1})
                                }
                            }
                            Log(new Error(),"Block.TargetLocation: ",Block.targetLocation);
                        }else if(Block.spellSlot==6){
                            Log(new Error(),"Priority is custom location pixel scan");
                            //custom pixel location
                            Block.targetLocation={X:Block.scanCustomLocation[0],Y:Block.scanCustomLocation[1]}
                            Block.targetColor=hexToRGB(Block.scanColorCustomRGB)
                            Log(new Error(),"Block.targetLocation: ",Block.targetLocation);
                        }else{throw new Error("invalid Block.spellSlot")}
                    }else if (Block.scanType=="image"){
                        if(Block.spellSlot<5){
                            Log(new Error(),"Calculating regions and buffers for image-scan");
                            let ScanDimensions = ScanningPictureRegions[(Block.spellSlot)][""+(this.#selectedScreen.size.height*this.#selectedScreen.scaleFactor)]
                            let interpCoords = interpolate({x:ScanDimensions.MinX,y:ScanDimensions.MinY},{x:ScanDimensions.MaxX,y:ScanDimensions.MaxY},this.scaleFactor)
                            interpCoords={X:Math.floor(interpCoords.X),Y:Math.floor(interpCoords.Y)}
                            let scaledDimension = Math.floor(Lerp(ScanDimensions.MinScale,ScanDimensions.MaxScale,this.scaleFactor))
                            let Result = await PictureToBuffer(Block.ScanImagePath)
                            Block.ScanImageBuffer = Result
                            Block.targetLocation=interpCoords
                            Log(new Error(),"Block.targetLocation: ",Block.targetLocation);
                            Block.ScanWidth=scaledDimension
                            Block.ScanHeight=scaledDimension
                        }else if (Block.spellSlot==5){
                            Log(new Error(),"Priority is buff image scan");
                            //TODO buffs image scans here
                            Block.targetLocation=[]
                            let SelectedRegion=ScanningPictureRegions[5][""+(this.#selectedScreen.size.height*this.#selectedScreen.scaleFactor)]
                            let X = Math.floor(SelectedRegion.XFunction(this.scaleFactor))
                            let Y = Math.floor(SelectedRegion.YFunction(this.scaleFactor))
                            let Scale = Math.floor(SelectedRegion.ScaleFunction(this.scaleFactor))
                            Log(new Error(),"X,Y,Scale: ",X,Y,Scale);
                            Block.ScanWidth=Scale
                            Block.ScanHeight=Scale
                            if(!fs.existsSync(Block.ScanImagePath))throw new Error("Scan reference image is missing")
                            let {data,info} = await sharp(Block.ScanImagePath).resize(Scale,Scale).ensureAlpha().raw().toBuffer({resolveWithObject:true})
                            Block.ScanImageBuffer=data
                            Log(new Error(),"ScanWidth and ScanHeight: ",Block.ScanWidth,Block.ScanHeight);
                            for(let y=0;y<SelectedRegion.Settings.width;y++){
                                for(let z=0;z<SelectedRegion.Settings.height;z++){
                                    Block.targetLocation.push({X:Math.floor(X+(SelectedRegion.Settings.WidthPadding*y+Scale*y))+1,Y:Math.floor(Y-(SelectedRegion.Settings.HeightPadding*z+Scale*z))})
                                }
                            }
                            Log(new Error(),"Block.TargetLocation: ",Block.targetLocation);
                        }else if(Block.spellSlot==6){
                            Log(new Error(),"Priority is custom location image scan");
                            //handle custom image scans here
                            let {data,info} = await sharp(Block.ScanImagePath).ensureAlpha().raw().toBuffer({resolveWithObject:true})
                            Block.ScanImageBuffer=data
                            Block.targetLocation={X:Block.scanCustomLocation[0],Y:Block.scanCustomLocation[1]}
                            Block.ScanWidth=info.width
                            Block.ScanHeight=info.height
                            
                        }else{throw new Error("invalid Block.spellSlot")}
                    }else{
                        throw new Error("invalid Block.scanType")
                    }
                    if (!Block.targetLocation){
                        console.error("Block.targetLocation failed! Values are not valid!")
                        throw new Error("Block.targetLocation failed! Values are not valid!")
                    }
                }
                // (Block.scanColorType=="custom")?Block.targetColor=hexToRGB(Block.scanColorCustomRGB):Block.targetColor=ColorPresets[Block.scanColorType]
            
            }
        } catch (error) {
            console.log("error: ",error);
            return;
        }
    }
    


    async checkImageScan(Block,bIsTesting,BlockIndex){
        Log(new Error(),"Check image scans called")
        try {
            if(bIsTesting)SexyAssScanBuffer={};
            if(Block.status=="playing")return Promise.resolve(false);
            // let Block = this.Blocks[BlockIndex]
            if(PreventIndex>BlockIndex)return Promise.resolve(false);
            let conditionMet=false
            if(!bIsTesting&&Block.startStatus=="playing"&&!Block.Started)
            {
                Log(new Error(),"BLOCK STARTS ACTIVE");
                return Promise.resolve(true)
            }
            if(bIsTesting||(Block.status=="scanning"&&Block.blockType=="image-scan"))
            {
                if(Block.spellSlot<5){
                    if(Block.scanType=="pixel")
                    {
                        if(bIsTesting){
                            let DataArray = PixelScan(bIsTesting,Block.targetLocation,Block.targetColor,Block.confidence)
                            fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(DataArray,null," "))
                        }else{
                            return Promise.resolve(PixelScan(bIsTesting,Block.targetLocation,Block.targetColor,Block.confidence,BlockIndex))
                        }
                    }else if(Block.scanType=="image"){
                        if(!Block.ScanImageBuffer)throw new Error("Missing scan image buffer");
                        //Do image scanning tech for icons
                        if (bIsTesting) {
                            await sharp(Block.ScanImageBuffer, {raw: {width: 64,height: 64,channels: 4}})
                            .toFormat('png')
                            .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"TemplateImage.png"));
                            let ImageCaptureBuffer = await CaptureRegionToBuffer(Block.targetLocation.X,Block.targetLocation.Y,Block.ScanWidth,Block.ScanHeight,64,64);
                            await sharp(ImageCaptureBuffer,{raw:{width:64,height:64,channels:4}})
                            .toFormat("png")
                            .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"CapturedImage.png"));
                            const diff = Buffer.alloc(ImageCaptureBuffer.length)
                            const NumOfMismatch = Pixelmatch(Block.ScanImageBuffer,ImageCaptureBuffer,diff,64,64,{diffMask:true,threshold:Threshold})
                            let Similarity = 1-getAlpha(NumOfMismatch,0,4096)
                            await sharp(diff,{raw:{width:64,height:64,channels:4}})
                            .toFormat("png")
                            .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ComparisonScan.png"));
                            let DataArray={
                                ScanLocation:Block.targetLocation,
                                ScanDimensions:{Width:Block.ScanWidth,Height:Block.ScanHeight},
                                ConfidenceNeeded:Block.confidence,
                                CurrentConfidence:Similarity,
                                DidPrioritySucceed:Similarity >= Block.confidence
                            }
                            fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(DataArray,null," "))
                        } else {
                            return CaptureRegionToBuffer(Block.targetLocation.X,Block.targetLocation.Y,Block.ScanWidth,Block.ScanHeight,64,64).then((ImageCaptureBuffer) =>{
                                conditionMet=CompareImageBuffers(Block.ScanImageBuffer,ImageCaptureBuffer,Block.confidence)
                                if(conditionMet)Log(new Error(),"IMAGE CONDITION MET");
                                return conditionMet;
                            })
                        }
                    }
                }else if(Block.spellSlot==5){
                    //do image scanning tech for buffs
                    if(Block.scanType=="pixel"){
                        //Do buff location pixel comparison
                        if(bIsTesting){
                            let ScanData=[]
                            for(let x=0;x<Block.targetLocation.length;x++){
                                // let ColorAtPixel = getPixelColor(Block.targetLocation[x])
                                // let totalDifference = 0;
                                // const maxDifference = 255 * Block.targetColor.length;
                                // for (let i = 0; i < Block.targetColor.length; i++) {
                                //     totalDifference += Math.abs(Block.targetColor[i] - ColorAtPixel[i]);
                                // }
                                // const Confidence = 1 - totalDifference / maxDifference;
                                let DataArray=PixelScan(bIsTesting,Block.targetLocation[x],Block.targetColor,Block.confidence)
                                ScanData.push(DataArray)
                            }
                            ScanData.push({TargetColor:Block.targetColor,ConfidenceNeeded:Block.confidence})
                            fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(ScanData,null," "))
                        }else{
                            for(let x=0;x<Block.targetLocation.length;x++){
                                conditionMet=PixelScan(bIsTesting,Block.targetLocation[x],Block.targetColor,Block.confidence)
                                if(conditionMet){
                                    Log(new Error(),"IMAGE CONDITION MET");
                                    return Promise.resolve(conditionMet)
                                }
                            }
                            return Promise.resolve(false)
                        }
                    }else if(Block.scanType=="image"){
                        if(!Block.ScanImageBuffer)throw new Error("Missing scan image buffer");
                        //crazy ass buff location with image comparison
                        if(bIsTesting){
                            let ScanData=[]
                            await sharp(Block.ScanImageBuffer,{raw:{width:Block.ScanWidth,height:Block.ScanHeight,channels:4}})
                            .toFormat('png')
                            .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"TemplateImage.png"));
                            for (let x=0;x<Block.targetLocation.length;x++){
                                if(!Block.ScanImageBuffer)throw new Error("Missing scan image buffer");
                                let ImageCaptureBuffer = await CaptureRegionToBuffer(Block.targetLocation[x].X,Block.targetLocation[x].Y,Block.ScanWidth,Block.ScanHeight)     
                                await sharp(ImageCaptureBuffer,{raw:{width:Block.ScanWidth,height:Block.ScanHeight,channels:4}})
                                .toFormat("png")
                                .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"Buff"+(x+1)+"CapturedImage.png"));
                                const diff = Buffer.alloc(ImageCaptureBuffer.length)
                                const NumOfMismatch = Pixelmatch(Block.ScanImageBuffer,ImageCaptureBuffer,diff,Block.ScanWidth,Block.ScanHeight,{diffMask:true,threshold:Threshold})
                                let Similarity = 1-getAlpha(NumOfMismatch,0,Block.ScanWidth*Block.ScanHeight)
                                await sharp(diff,{raw:{width:Block.ScanWidth,height:Block.ScanHeight,channels:4}})
                                .toFormat("png")
                                .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"Buff"+(x+1)+"ComparisonScan.png"))
                                ScanData.push({ScanLocation:Block.targetLocation[x],CurrentConfidence:Similarity,DidPrioritySucceed:Similarity>=Block.confidence})
                            }
                            ScanData.push({TargetColor:Block.targetColor,ConfidenceNeeded:Block.confidence})
                            fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(ScanData,null," "))
                        }else{
                            for(let x=0;x<Block.targetLocation.length;x++){
                                if(!Block.ScanImageBuffer)throw new Error("Missing scan image buffer")
                                let ImageCaptureBuffer=await CaptureRegionToBuffer(Block.targetLocation[x].X,Block.targetLocation[x].Y,Block.ScanWidth,Block.ScanHeight)
                                const diff = Buffer.alloc(ImageCaptureBuffer.length)
                                const NumOfMismatch = Pixelmatch(Block.ScanImageBuffer,ImageCaptureBuffer,diff,Block.ScanWidth,Block.ScanHeight,{diffMask:true,threshold:Threshold})
                                let Similarity = 1-getAlpha(NumOfMismatch,0,Block.ScanWidth*Block.ScanHeight)
                                if(Similarity>=Block.confidence){
                                    if(conditionMet)Log(new Error(),"IMAGE CONDITION MET");
                                    return Promise.resolve(true);
                                }
                            }
                            return Promise.resolve(false);
                        }
                    }else{throw new Error("invalid Block.scanType")}
                }else{
                    //image scanning for custom location
                    if(Block.scanType=="pixel"){
                        //Do custom location pixel comparison
                        if(bIsTesting){
                            Log(new Error(),"Doing custom pixel tests")
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
                            fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(DataArray,null," "))
                        }else{
                            if (Block.targetLocation.X==undefined||Block.targetLocation.Y==undefined){
                                console.error("Block.targetLocation failed! Values are not valid!")
                                throw new Error("Block.targetLocation failed! Values are not valid!")
                            }
                            let ColorAtPixel = getPixelColor(Block.targetLocation)
                            conditionMet = isWithinConfidence(Block.targetColor,ColorAtPixel,Block.confidence) 
                            if(conditionMet)Log(new Error(),"IMAGE CONDITION MET");
                            return Promise.resolve(conditionMet)
                        }
                    }else if(Block.scanType){
                        if(!Block.ScanImageBuffer)throw new Error("Missing scan image buffer");
                        //crazy ass custom location with image comparison
                        if(bIsTesting){
                            sharp(Block.ScanImageBuffer, {raw: {width: Block.ScanWidth,height: Block.ScanHeight,channels: 4}})
                                .toFormat('png')
                                .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"TemplateImage.png"))
                                .then(() => {
                                    CaptureRegionToBuffer(Block.targetLocation.X,Block.targetLocation.Y,Block.ScanWidth,Block.ScanHeight).then((ImageCaptureBuffer)=>{
                                        sharp(ImageCaptureBuffer,{raw:{width:Block.ScanWidth,height:Block.ScanHeight,channels:4}})
                                        .toFormat("png")
                                        .toFile(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"CapturedImage.png"))
                                        .then(()=>{
                                            const diff = Buffer.alloc(ImageCaptureBuffer.length)
                                            const NumOfMismatch = Pixelmatch(Block.ScanImageBuffer,ImageCaptureBuffer,diff,Block.ScanWidth,Block.ScanHeight,{diffMask:true,threshold: Threshold})
                                            let Similarity = 1-getAlpha(NumOfMismatch,0,Block.ScanWidth*Block.ScanHeight)
                                            sharp(diff, { raw: { width: Block.ScanWidth, height: Block.ScanHeight, channels: 4 } })
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
                                                    fs.writeFileSync(path.join(app.getPath("userData"),"TestScans","Priority"+(BlockIndex+1)+"ScanResult.json"),JSON.stringify(DataArray,null," "))
                                                })
                                                .catch((err) => console.error("Error saving diff image:", err));
                                        })
                                        .catch(error=>{console.error("Error saving capture image: ",error);
                                        })
                                    })
                                })
                        }else{
                            //return promise here
                            let ImageCaptureBuffer = await CaptureRegionToBuffer(Block.targetLocation.X,Block.targetLocation.Y,Block.ScanWidth,Block.ScanHeight)
                            const diff = Buffer.alloc(ImageCaptureBuffer.length)
                            const NumOfMismatch = Pixelmatch(Block.ScanImageBuffer,ImageCaptureBuffer,diff,Block.ScanWidth,Block.ScanHeight,{diffMask:true,threshold:Threshold})
                            let Similarity=1-getAlpha(NumOfMismatch,0,Block.ScanWidth*Block.ScanHeight)
                            return Similarity>=Block.confidence
                        }
                    }else{throw new Error("invalid Block.scanType")}
                }
            }
            return Promise.resolve(conditionMet)
        } catch (error) {
            console.error("Error: ",error);
        }
    }

    
    doOutputs(Block,BlockIndex,bIsPostOp){
        if(Block.status=="playing")return PreventIndex;
        Log(new Error(),"#"+BlockIndex,": ","DOING OUTPUTS");
        if(!bIsPostOp&&PreventIndex>BlockIndex){
            Log(new Error(),"#"+BlockIndex,": ","STOPPED BY PREVENTATIVE INDEX: ",PreventIndex);
            return PreventIndex
        }
        let cap = (bIsPostOp)?Block.PostTrackOperations.length:Block.outputArray.length
        for(let x=0;x<cap;x++){
            let output=(bIsPostOp)?Block.PostTrackOperations[x]:Block.outputArray[x]
            if(Block.Started==false)Block.Started=true;
            if(!bIsPostOp){
                Log(new Error(),`#${BlockIndex}: Changing block status to playing`)
                Block.changeStatus("playing");
            }
            switch (output.cmd) {
                case "stop":
                    Log(new Error(),"#"+BlockIndex,": ","ATTEMPTING TO STOP LOWER PRIORITY MUSIC MUSIC");
                    if(BlockIndex>0)for(let y=BlockIndex-1;y>=0;y--)this.Blocks[y].stopAllTracks();
                    break;
                case "play":
                    Log(new Error(),"#"+BlockIndex,": ","PLAYING TRACK");
                    if(Block.Tracks.length>0){
                        if(bIsPostOp){
                            Log(new Error(),`#${BlockIndex}: Changing block status to playing`)
                            Block.changeStatus("playing");
                        }
                        let UUID=Math.floor(Math.random()*1e6)
                        if(Block.bUseVisualizer)visualizerWindow.send("inbound-settings",{bFillVisualizer:Block.bFillVisualizer,VisualizerFillColor:Block.VisualizerFillColor,VisualizerLineColor:Block.VisualizerLineColor,VisualizerFillPatternPath:Block.VisualizerFillPatternPath},UUID);
                        Block.Tracks[(Block.bIsRandom)?Math.floor(Math.random()*Block.Tracks.length):Block.TrackIndex].playTrack(Block.bUseVisualizer,UUID);
                        Block.TrackIndex++;
                        if(Block.TrackIndex>(Block.Tracks.length-1))Block.TrackIndex=0;  
                    }else Log(new Error(),"#"+BlockIndex,": ","NO TRACKS FOUND. SKIPPING");
                    break;
                case "play-all":
                    Log(new Error(),"#"+BlockIndex,": ","PLAYING ALL TRACKS");
                    for(let x=0;x<Block.Tracks.length;x++){
                        let UUID=Math.floor(Math.random()*1e6)
                        if(Block.bUseVisualizer)visualizerWindow.send("inbound-settings",{bFillVisualizer:Block.bFillVisualizer,VisualizerFillColor:Block.VisualizerFillColor,VisualizerLineColor:Block.VisualizerLineColor,VisualizerFillPatternPath:Block.VisualizerFillPatternPath},UUID);
                        Block.Tracks[x].playTrack(Block.bUseVisualizer,UUID);
                    }
                    if(bIsPostOp&&Block.Tracks.length>0){
                        Log(new Error(),`#${BlockIndex}: Changing block status to playing`)
                        Block.changeStatus("playing");
                    }
                    break;
                case "prevent":
                    if(BlockIndex>=PreventIndex){
                        Log(new Error(),"#"+BlockIndex,": ","SETTING PREVENTATIVE INDEX");
                        PreventIndex=BlockIndex;
                    }
                    Block.PreventCallback=()=>{
                        Log(new Error(),"PreventCallback called");
                        Log(new Error(),"Block.status: ",Block.status);
                        if(Block.status!="playing"&&BlockIndex>=PreventIndex){
                            PreventIndex=0;
                            Log(new Error(),"#"+BlockIndex,": ","Block was playing and its index greater/equal to PreventIndex. Resetting PreventIndex")
                        }else if(Block.status=="playing"){
                            Log(new Error(),"#"+BlockIndex,": ","Block was still playing")
                        }
                        Block.PreventCallback=undefined;
                    }
                    break;
                case "add":
                    Log(new Error(),`Adding ${output.value} to ${output.stack}`);
                    Variables[output.stack]+=output.value;
                    if(mainWindow)mainWindow.send("UpdateValues",{Variables:Variables});
                    Log(new Error(),"New variable value: ",Variables[output.stack]);
                    break;
                case "sub":
                    Log(new Error(),`Subtracting ${output.value} from ${output.stack}`);
                    Variables[output.stack]-=output.value;
                    if(mainWindow)mainWindow.send("UpdateValues",{Variables:Variables});
                    Log(new Error(),"New variable value: ",Variables[output.stack]);
                    break;
                case "set":
                    Log(new Error(),`Setting ${output.stack} to ${output.value}`);
                    Variables[output.stack]=output.value;
                    if(mainWindow)mainWindow.send("UpdateValues",{Variables:Variables});
                    Log(new Error(),"New variable value: ",Variables[output.stack]);
                    break;
                default:
                    throw new Error("Output type isn't valid")
                    break;
            }
        }
        return PreventIndex
    }
    async startScanning(window,MainWindow)
    {
        mainWindow=MainWindow;
        visualizerWindow=window;
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
        PreventIndex=0
        const audioContext=new AudioContext()
        for(let BlockIndex=this.Blocks.length-1;BlockIndex>=0;BlockIndex--){
            this.Blocks[BlockIndex].BlockIndex=BlockIndex;
            this.Blocks[BlockIndex].PostOpCallback=this.doOutputs
            for(let x=0;x<this.Blocks[BlockIndex].Tracks.length;x++){
                this.Blocks[BlockIndex].Tracks[x].TrackDuration=await getTrackLength(audioContext,this.Blocks[BlockIndex].Tracks[x].TrackURL)
            }
        }
        this.scanningThread = setInterval(()=>{
            //iterate through each block, and get the coord
            //insert evil ass rape scanner
            for(let BlockIndex=this.Blocks.length-1;BlockIndex>=0;BlockIndex--){
                let Block = this.Blocks[BlockIndex]
                this.checkImageScan(Block,false,BlockIndex).then(result=>{
                    if(result)
                    {
                        Log(new Error(),"#",BlockIndex,": Condition met. Doing outputs")
                        PreventIndex=this.doOutputs(Block,BlockIndex)
                    }else{
                        // Log(new Error(),"CONDITION WAS NOT MET");
                    }
                    for(let z=0;z<Block.conditionalArray.length;z++){
                        let Cond = Block.conditionalArray[z]
                        if(Cond.condOperator==""||Cond.condOutput==""||Cond.condStack==""){
                            Log(new Error(),"Condition is missing either its operator, stack, or output. Skipping: ",Cond)
                        }else{
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
                                default:
                                    Log(new Error(),"no conditional operator provided")
                                    break;
                            }
                            if (ConditionalMet){
                                // Log(new Error(),"CONDITION HAS BEEN MET IN CONDITIONAL ARRAY");
                                if(PreventIndex<=BlockIndex)
                                {
                                    // Log(new Error(),"block: ",Block.status);
                                    // if(Block.status!="playing"){Log(new Error(),"BLOCK IS NO LONGER ACTIVE");}
                                    if(Block.status=="playing"&&Cond.condOutput!="playing"){
                                        Log(new Error(),"STOP THAT SHIT RN");   
                                        Log(new Error(),"Block.Status: ",Block.status);
                                        Log(new Error(),"Cond.condOutput: ",Cond.condOutput);
                                        Log(new Error(),`#${BlockIndex}: Changing block status to ${Cond.condOutput}`)
                                        Block.changeStatus(Cond.condOutput)
                                        Block.stopAllTracks()
                                    }else if(Block.status!="playing"&&Cond.condOutput=="playing"){
                                        Log(new Error(),"CONDITION MET. DOING OUTPUTS");
                                        // let UUID=Math.floor(Math.random()*1e6)
                                        // if(Block.bUseVisualizer)window.send("inbound-settings",{bFillVisualizer:Block.bFillVisualizer,VisualizerFillColor:Block.VisualizerFillColor,VisualizerLineColor:Block.VisualizerLineColor,VisualizerFillPatternPath:Block.VisualizerFillPatternPath},UUID)
                                        this.doOutputs(Block,BlockIndex)
                                    }else if(Block.status!=Cond.condOutput)
                                    {
                                        Log(new Error(),`#${BlockIndex}: Changing block status to ${Cond.condOutput}`)
                                        Block.changeStatus(Cond.condOutput)
                                    }
                                }else{
                                    Log(new Error(),"ACTION STOPPED DUE TO PREVENTION");
                                }
                            }
                        }
                    }
                })
                //TODO CHECK CONDITIONALS
                //Log(new Error(),"block: ",Block.conditionalArray);
            }
        },this.heartbeat)
    }
    stopScanning()
    {
        //stop all music
        //reset all blocks to default value
        if (this.scanningThread)clearInterval(this.scanningThread);
        for(let x=0;x<this.Blocks.length;x++)
        {
            let Block = this.Blocks[x]
            Block.stopAllTracks()
            Block.status="scanning"
            Block.Started=false;
            Block.TrackIndex=0;
            Block.ScanImageBuffer=undefined
            Block.PostOpCallback=undefined
        }
        //reset all vars to default values
        Variables = {...VariableReset}
        if(mainWindow){
            let Blocks=[]
            for(let x=0;x<this.Blocks.length;x++){
                let Block = {UUID:this.Blocks[x].UUID,status:this.Blocks[x].status}
                Blocks.push(Block)
            }
            mainWindow.send("UpdateValues",{Blocks:Blocks,Variables:Variables})
        }
        this.scanningThread=undefined
        visualizerWindow.send("stop-visualizer")
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
                //Log(new Error(),"item: ",item);
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
        Log(new Error(),"Data saved: ",data);
        if(data&&data.currentPriority)this.currentPriority = data.currentPriority;
        if(data&&data.heartbeat)this.heartbeat = data.heartbeat;
        if(data&&data.LeagueDir)this.changeLeagueDir(data.LeagueDir)
        if(data&&data.Blocks&&data.Blocks.length>0)
        {
            data.Blocks.forEach(element => {
                Log(new Error(),"element: ",element);
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
        this.status = "scanning"
        this.startStatus=(options&&options.startStatus)?options.startStatus:"scanning"
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
        this.PostTrackOperations = (options&&options.PostTrackOperations)?options.PostTrackOperations:[]
        this.PostOpCallback
        this.BlockIndex
    }
    changeStatus(newStatus)
    {
        Log(new Error(),"#",(this.BlockIndex!=undefined)?this.BlockIndex:"UNKNOWN: ","old status, new status: ",this.status,newStatus);
        let bDoOperationsFlag=false
        if(this.status=="playing"&&newStatus=="scanning"&&this.PostTrackOperations.length>0){
            Log(new Error(),"Post Operation conditions met")
            bDoOperationsFlag=true
        } 
        if(this.status!=newStatus){
            this.status=newStatus
            let Blocks=[{UUID:this.UUID,status:this.status}]
            mainWindow.send("UpdateValues",{Blocks:Blocks})
            if(this.PreventCallback)this.PreventCallback();
            if(bDoOperationsFlag&&this.PostOpCallback){Log(new Error(),"Attempting to perform post track operations"); this.PostOpCallback(this,this.BlockIndex,true);}
        }
    }
    checkStatus(){
        Log(new Error(),"#",(this.BlockIndex)?this.BlockIndex:"UNKNOWN: ","checking status of block")
        for(let x=0;x<this.Tracks.length;x++){
            if(this.Tracks[x].status!="inactive")return;
        }
        if(this.status=="playing"){
            Log(new Error(),`#${this.BlockIndex}: Changing block status to scanning`);
            this.changeStatus("scanning");
        }else {
            Log(new Error(),`#${this.BlockIndex}: Changing block status to ${this.status}`);
            this.changeStatus(this.status);
        }
    }
    stopAllTracks()
    {
        Log(new Error(),"#"+(this.BlockIndex)?this.BlockIndex:"UNKNOWN: ","Stopping all tracks within block")
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
        console.log("UUID: ",UUID);
        this.Tracks=this.Tracks.filter(track=>track.UUID!==UUID)
        let DeRefTracks=[...this.Tracks]
        DeRefTracks.forEach(Track=>Track.ParentBlock=undefined)
        Log(new Error(),"this.Tracks: ",DeRefTracks);
    }
    toJSON(){
        return{
            bIsFadeIn:this.bIsFadeIn,
            FadeInDuration:this.FadeInDuration,
            bIsFadeOut:this.bIsFadeOut,
            FadeOutDuration:this.FadeOutDuration,
            bIsRandom:this.bIsRandom,
            spellSlot:this.spellSlot,
            scanColorType:this.scanColorType,
            scanColorCustomRGB:this.scanColorCustomRGB,
            scanCustomLocation:this.scanCustomLocation,
            scanLocation:this.scanLocation,
            confidence:this.confidence,
            startStatus:this.startStatus,
            blockType:this.blockType,
            outputArray:this.outputArray,
            ScanImagePath:this.ScanImagePath,
            conditionalArray:this.conditionalArray,
            scanType:this.scanType,
            spellArea:this.spellArea,
            bUseVisualizer:this.bUseVisualizer,
            VisualizerLineColor:this.VisualizerLineColor,
            bFillVisualizer:this.bFillVisualizer,
            VisualizerFillColor:this.VisualizerFillColor,
            VisualizerFillPatternPath:this.VisualizerFillPatternPath,
            PostTrackOperations:this.PostTrackOperations,
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
        this.stoppingThread
    }
    toJSON(){
        return{
            TrackURL:this.TrackURL,
            UUID:this.UUID
        }
    }
    cleanupTrack(){
        Log(new Error(),this.TrackURL.split(/[/\\]/).pop(),": Cleaning up track")
        if(!this.status=="inactive"){
            this.status="inactive";
            if(this.FadeOutThread)clearTimeout(this.FadeOutThread);
            this.FadeOutThread=undefined;
            this.GainNode=undefined;
            this.Source=undefined;
            this.ParentBlock.checkStatus()
        }
        if(this.VisualizerThread){
            Log(new Error(),this.TrackURL.split(/[/\\]/).pop(),": stopping visualizer");
            clearInterval(this.VisualizerThread);
            this.VisualizerThread=undefined;
            visualizerWindow.send("stop-visualizer")
        }
    }
    stopTrack()
    {
        function realStop(Self)
        {
            Log(new Error(),`Stopping track ${Self.TrackURL}...`);
            if(Self.status=="inactive"){
                Log(new Error(),Self.TrackURL.split(/[/\\]/).pop(),": Track is inactive. Skipping");
                console.log(Self.stoppingThread)
                if(Self.stoppingThread){
                    clearInterval(Self.stoppingThread);
                    Self.stoppingThread=undefined;
                }
               return;
            }
            if(Self.ParentBlock.bIsFadeOut)
            {
                Log(new Error(),Self.TrackURL.split(/[/\\]/).pop(),": Fadding out...");
                Self.status="inactive"
                Self.ParentBlock.checkStatus()
                AsyncTween(Self.GainNode,1,0,Self.ParentBlock.FadeOutDuration*1000).then(()=>{
                    Log(new Error(),Self.TrackURL.split(/[/\\]/).pop(),": Song over?");
                    try {
                        Self.Source.stop();
                        Self.Source.disconnect();
                    } catch (error) {
                        Log(new Error(),Self.TrackURL.split(/[/\\]/).pop(),": Source hasnt started yet");
                    }
                    // this.ParentBlock.status="scanning"
                    if(Self.FadeOutThread)clearTimeout(Self.FadeOutThread);
                    if(Self.VisualizerThread){
                        Log(new Error(),Self.TrackURL.split(/[/\\]/).pop(),": stopping visualizer");
                        clearInterval(Self.VisualizerThread);
                        Self.VisualizerThread=undefined;
                        visualizerWindow.send("stop-visualizer")
                    }
                    Self.FadeOutThread=undefined;
                    Self.GainNode=undefined;
                    Self.Source=undefined;
                    Self.VisualizerThread=undefined;
                })
            }else{
                Log(new Error(),"Hard stopping");
                Self.status="inactive"
                Self.ParentBlock.checkStatus()
                try {
                    Self.Source.stop();
                    Self.Source.disconnect();
                } catch (error) {
                    Log(new Error(),"Source hasnt started yet");
                }
                // this.ParentBlock.status="scanning"
                if(Self.FadeOutThread)clearTimeout(Self.FadeOutThread);
                if(Self.VisualizerThread){Log(new Error(),"stopping visualizer");
                    clearInterval(Self.VisualizerThread);Self.VisualizerThread=undefined;}
                Self.FadeOutThread=undefined;
                Self.GainNode=undefined;
                Self.Source=undefined;
                Self.VisualizerThread=undefined;
            }
        }
        if(this.ThreadBusy){
            this.stoppingThread=setInterval(() => {
                if(!this.ThreadBusy)realStop(this);
                console.log(this.stoppingThread);
                
            }, 500);
        }else{
            realStop(this)
        }
    }

    updateVisualizer(analyser,UUID){
        if(!visualizerWindow)throw new Error("Visualizer window is invalid")
        const frequencyData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(frequencyData)
        let Frequencies = Array.from(frequencyData)
        let flipped = Frequencies.slice().reverse()
        let concat = flipped.concat(Frequencies)
        const reducedData = downsampleFrequencyData(concat, 64);
        // const SmoothData =smoothData(reducedData,1)
        const ExaggeratedValue = exaggerate(reducedData,3,2)
        visualizerWindow.send("inbound-frequency",ExaggeratedValue,UUID)
    }

    async playTrack(bUseVisualizer,UUID){
        try {
            if(this.ThreadBusy)throw new Error(`Playing Thread for track ${this.TrackURL} is already busy`);
            this.ThreadBusy=true
            this.status="active"
            const audioContext = new AudioContext()
            if(!fs.existsSync(this.TrackURL))throw new Error("Track URL is invalid. This file cannot be found: "+this.TrackURL);
            this.Source = audioContext.createBufferSource()
            this.Source.buffer = await getBuffer(audioContext,this.TrackURL)
            this.GainNode=audioContext.createGain()
            this.GainNode.gain.value=1.0
            this.Source.connect(this.GainNode)
            this.GainNode.connect(audioContext.destination)
            if(bUseVisualizer&&visualizerWindow){
                const analyser =audioContext.createAnalyser()
                this.Source.connect(analyser)
                analyser.fftSize=2048
                if(this.VisualizerThread)clearInterval(this.VisualizerThread);
                visualizerWindow.setAlwaysOnTop(true,"screen-saver",1);
                visualizerWindow.setFullScreenable(false);
                visualizerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                this.VisualizerThread=setInterval(()=>{
                    this.updateVisualizer(analyser,UUID)
                },1)
            }
            if(!this.TrackDuration)this.TrackDuration=await getTrackLength(audioContext,this.TrackURL);
            if(this.ParentBlock.bIsFadeOut&&this.ParentBlock.FadeOutDuration<=this.TrackDuration){
                this.FadeOutThread = setTimeout(()=>{
                    Log(new Error(),this.TrackURL.split(/[/\\]/).pop(),": Fading out track...")
                    this.status="inactive"
                    AsyncTween(this.GainNode,1,0,this.ParentBlock.FadeOutDuration*1000)
                    this.ParentBlock.checkStatus()
                    Log(new Error(),this.TrackURL.split(/[/\\]/).pop(),": Fading out complete. Cleaning up track")
                    this.cleanupTrack();
                },(this.TrackDuration-this.ParentBlock.FadeOutDuration)*1000)

            }else{
                this.Source.onended = this.cleanupTrack
            }
            Log(new Error(),"Playing track: ",this.TrackURL.split(/[/\\]/).pop())
            this.Source.start()
            if(this.ParentBlock.bIsFadeIn&&this.ParentBlock.FadeInDuration<=this.TrackDuration){
                this.GainNode.gain.value=0;
                Log(new Error(),this.TrackURL.split(/[/\\]/).pop(),": Fading in track")
                await AsyncTween(this.GainNode,0,1,this.ParentBlock.FadeInDuration*1000)
                Log(new Error(),this.TrackURL.split(/[/\\]/).pop(),": Fading in complete")
            }
            this.ThreadBusy=false
            return Promise.resolve(true)
        } catch (error) {
            Log(new Error(),error)
            console.error(error);
            this.ThreadBusy=false
            return Promise.reject()
        }
    }
    // playTrack(bUseVisualizer,visualizerWindow)
    // {
    //     try {
    //         this.ThreadBusy=true   
    //         const audioContext = new AudioContext()
    //         if(!fs.existsSync(this.TrackURL))throw new Error("Track URL is invalid. This file cannot be found: "+this.TrackURL)
    //         getBuffer(audioContext,this.TrackURL).then((audioBuffer)=>{
    //             this.Source = audioContext.createBufferSource();
    //             this.Source.buffer = audioBuffer 
    //             this.GainNode = audioContext.createGain()
    //             this.GainNode.gain.value=1.0
    //             this.Source.connect(this.GainNode)
    //             this.visualizerWindow=visualizerWindow
    //             if(bUseVisualizer&&visualizerWindow){
    //                 const analyser = audioContext.createAnalyser()
    //                 this.Source.connect(analyser)
    //                 analyser.fftSize=2048;
    //                 if(this.VisualizerThread){clearInterval(this.VisualizerThread);this.VisualizerThread=undefined;}
    //                 visualizerWindow.setAlwaysOnTop(true,"screen-saver",1);
    //                 visualizerWindow.setFullScreenable(false);
    //                 visualizerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    //                 // Below statement completes the flow
    //                 let UUID = generateUUID("visualizerIdSet")
    //                 this.VisualizerThread=setInterval(()=>{
    //                     if (!visualizerWindow.isFocused()) {
    //                         visualizerWindow.focus();
    //                     }
    //                     visualizerWindow.moveTop();
    //                     // visualizerWindow.focus()
    //                     const frequencyData = new Uint8Array(analyser.frequencyBinCount)
    //                     analyser.getByteFrequencyData(frequencyData)
    //                     let Frequencies = Array.from(frequencyData)
    //                     let flipped = Frequencies.slice().reverse()
    //                     let concat = flipped.concat(Frequencies)
    //                     const reducedData = downsampleFrequencyData(concat, 64);
    //                     // const SmoothData =smoothData(reducedData,1)
    //                     const ExaggeratedValue = exaggerate(reducedData,3,2)
    //                     if(visualizerWindow)
    //                     {
    //                         visualizerWindow.send("inbound-frequency",ExaggeratedValue,UUID)
    //                     }
    //                 },1)
    //             }
    //             this.GainNode.connect(audioContext.destination)
    //             this.TrackDuration = getTrackLength(audioContext,this.TrackURL).then(TrackDuration=>{
    //                 this.TrackDuration=TrackDuration
    //                 this.Source.start()
    //                 if(this.ParentBlock.bIsFadeIn&&this.ParentBlock.FadeInDuration<=this.TrackDuration)
    //                 {
    //                     Log(new Error(),"Fading in...");
    //                     this.GainNode.gain.value=0
    //                     AsyncTween(this.GainNode,0,1,this.ParentBlock.FadeInDuration*1000)
    //                 }
    //                 this.status="active"
    //                 Log(new Error(),"Switch track to active");
    //                 if(this.ParentBlock.bIsFadeOut&&this.ParentBlock.FadeOutDuration<=this.TrackDuration){
    //                     Log(new Error(),"FADING SONG OUT IN ",(this.TrackDuration-this.ParentBlock.FadeOutDuration)*1000," MS")
    //                     this.FadeOutThread = setTimeout(()=>{
    //                         Log(new Error(),"FADING SONG OUT")
    //                         this.status="inactive"
    //                         this.ParentBlock.checkStatus()
    //                         AsyncTween(this.GainNode,1,0,this.ParentBlock.FadeOutDuration*1000).then(()=>{
    //                             Log(new Error(),"Song over?");
    //                             try {
    //                                 this.Source.stop();
    //                                 this.Source.disconnect();
    //                             } catch (error) {
    //                                 Log(new Error(),"Source hasnt started yet");
    //                             }
    //                             // this.ParentBlock.status="scanning"
    //                             if(this.FadeOutThread)clearTimeout(this.FadeOutThread);
    //                             if(this.VisualizerThread){
    //                                 Log(new Error(),"stopping visualizer");
    //                                 clearInterval(this.VisualizerThread);
    //                                 this.VisualizerThread=undefined;
    //                                 this.visualizerWindow.send("stop-visualizer")
    //                             }
    //                             this.FadeOutThread=undefined;
    //                             this.GainNode=undefined;
    //                             this.Source=undefined;
    //                             this.VisualizerThread=undefined;
    //                         })
    //                     },(this.TrackDuration-this.ParentBlock.FadeOutDuration)*1000)
    //                 }else{
    //                     this.Source.onended = this.cleanupTrack
    //                 }
    //                 this.ThreadBusy=false
    //                 return
    //             })
    //         })
    //     } catch (error) {
    //         Log(new Error(),error)
    //         console.error(error);
    //     }
    // }
}

function PixelScan(bIsTesting,BlockTargetLocation,BlockTargetColor,BlockConfidence){
    //TODO Use sexy ass image buffer
    if(bIsTesting){
        let ColorAtPixel = getPixelColor(BlockTargetLocation)
        let totalDifference = 0;
        const maxDifference = 255 * BlockTargetColor.length;
        for (let i = 0; i < BlockTargetColor.length; i++) {
            totalDifference += Math.abs(BlockTargetColor[i] - ColorAtPixel[i]);
        }
        const Confidence = 1 - totalDifference / maxDifference;
        let DataArray={
            ScanLocation:BlockTargetLocation,
            TargetColor:BlockTargetColor,
            FoundColor:ColorAtPixel,
            ConfidenceNeeded:BlockConfidence,
            CurrentConfidence:Confidence,
            DidPrioritySucceed:Confidence >= BlockConfidence
        }
        return DataArray
    }else{
        if (BlockTargetLocation.X==undefined||BlockTargetLocation.Y==undefined){
            console.error("Block.targetLocation failed! Values are not valid!")
            throw new Error("Block.targetLocation failed! Values are not valid!")
        }
        let ColorAtPixel = getPixelColor(BlockTargetLocation)
        conditionMet = isWithinConfidence(BlockTargetColor,ColorAtPixel,BlockConfidence) 
        if(conditionMet)Log(new Error(),"IMAGE CONDITION MET");
        return conditionMet
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
            Log(new Error(),"duration: ", bufferInfo.duration);
            return bufferInfo.duration
        case ".wav":
            buffer = fs.readFileSync(path.join(filePath))
            bufferInfo = await audioContext.decodeAudioData(buffer.buffer)
            Log(new Error(),"duration: ", bufferInfo.duration);
            return bufferInfo.duration
    }
}
async function getBuffer(audioContext,filePath)
{
    Log(new Error(),"Audio Path: ",path.join(filePath));
    
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
async function AsyncTween(audioNode,startVolume,endVolume,duration){
    const startTime = performance.now();
    const stepTime = 10; // Interval time in ms
    function ease(t) {
        return t; // Linear easing; replace with an easing function if needed
    }
    while (true) {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        audioNode.gain.value = startVolume + ease(progress) * (endVolume - startVolume);

        if (progress >= 1) break;
        await new Promise((resolve) => setTimeout(resolve, stepTime));
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
function Lerp(Min,Max,Alpha){
    return Min + (Max - Min) * Alpha;
}
function hexToRGB(hex)
{
    hex=hex.replace("#","")
    const R=parseInt(hex.slice(0,2),16)
    const G=parseInt(hex.slice(2,4),16)
    const B=parseInt(hex.slice(4,6),16)
    Log(new Error(),"Hex: ",hex)
    Log(new Error(),"RGB: ",[R,G,B])
    return [R,G,B]
}
function getAlpha(currentValue, min, max) {
    if (currentValue < min) currentValue = min;
    if (currentValue > max) currentValue = max;
    return (currentValue - min) / (max - min);
}
function CaptureRegionToBuffer(x,y,width,height,resizeX,resizeY){
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
        .resize((resizeX)?resizeX:width,(resizeY)?resizeY:height)
        .ensureAlpha()
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
    if (ReferenceBuffer.length !== CaptureBuffer.length) {
        console.error("Buffer lengths do not match! :");
        console.log("ReferenceBuffer.length: ",ReferenceBuffer.length);
        console.log("CaptureBuffer.length: ",CaptureBuffer.length);
        return;
    }
    const diff = Buffer.alloc(ReferenceBuffer.length)
    const NumOfMismatch = Pixelmatch(CaptureBuffer,ReferenceBuffer,diff,64,64,{diffMask:true,threshold: Threshold})
    let Similarity = 1-getAlpha(NumOfMismatch,0,4096)
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
    const color = robot.getPixelColor(X, Y);
    let [r,g,b]=[parseInt(color.substring(0,2),16),parseInt(color.substring(2,4),16),parseInt(color.substring(4,6),16)];
    return [r,g,b];
}
function isWithinConfidence(Color1,Color2,Confidence)
{
    if (Color1.length !== Color2.length)throw new Error("Arrays must have the same length");
    // Log(new Error(),"Color1: ",Color1);
    // Log(new Error(),"Color2: ",Color2);
    let totalDifference = 0;
    const maxDifference = 255 * Color1.length;
    for (let i = 0; i < Color1.length; i++) {
        totalDifference += Math.abs(Color1[i] - Color2[i]);
    }
    const similarity = 1 - totalDifference / maxDifference;
    // Log(new Error(),"Similarity: ",similarity);
    return similarity >= Confidence;        
}

module.exports={getBuffer,AsyncTween,Script,Block,Track,ScanningAbilityBorderLocations,generateUUID,hexToRGB}
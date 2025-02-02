async function LoadModules(){
    await import("./components/blocktype-starttype.js")
    Log(new Error(),"blocktype-start loaded");
    await import("./components/priorityblock-header.js")
    Log(new Error(),"priorityblock-header loaded");
    await import("./components/trackoptions.js")
    Log(new Error(),"trackoptions loaded");
    await import ("./components/conditional.js")
    Log(new Error(),"conditional loaded");
    await import ("./components/posttrack-operations.js")
    Log(new Error(),"posttrack-operations loaded")
    Log(new Error(),"All modules loaded");
}

let WindowSelection = document.getElementById("DisplaySelect")
let LeagueDir = document.getElementById("LeagueDir")
let ResolutionDiv = document.getElementById("ResolutionDiv")
let createPriorityBtn = document.getElementById("CreatePriorityButton")
let PlayBtn = document.getElementById("PlayBtn")
let LeagueDirSpan = document.getElementById("LeagueDirSpan")
let PriorityContainer = document.getElementById("PriorityContainer")
let MouseDebugDiv = document.getElementById("mouse-debug-tools")
let MousePosSpan = document.getElementById("mouse-pos-span")
let MouseColorSpan = document.getElementById("mouse-color-span")
let NumOfDisplays,numOfPriorities,savedHeartbeat
let PrioityAssets=[
    {icon:"./assets/icons/D.png",title:"./assets/titles/Dismal.png"},
    {icon:"./assets/icons/C.png",title:"./assets/titles/Crazy.png"},
    {icon:"./assets/icons/B.png",title:"./assets/titles/Badass.png"},
    {icon:"./assets/icons/A.png",title:"./assets/titles/Apocalyptic.png"},
    {icon:"./assets/icons/S.png",title:"./assets/titles/Savage.png"},
    {icon:"./assets/icons/SS.png",title:"./assets/titles/Sick Skills.png"},
    {icon:"./assets/icons/SSS.png",title:"./assets/titles/Smokin Sexy Style.png"}
]
/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};
function ErrorParse(Error) {
    return "%c[RENDERER]%c [" + Error.stack.split("\n")[1].split("/").pop().replace(/[()]/g, "") + "]";
}
function Log(error, ...msg) {
    const formattedError = ErrorParse(error);
    console.log(formattedError, "color: rgb(255, 112, 112);", "", ...msg);
    window.electronAPI.SignalToMain("log", formattedError.replace(/%c/g,"")+":",...msg);
}

window.electronAPI.SignalToRenderer("log",(...args)=>{
    let matches=args[0].match(/\[[^\]]*\]|[^[]+/g)
    args[0] = "%c"+matches[0]+"%c"+matches[1]+matches[2];
    args.splice(1,0,"color:rgb(138, 253, 255);");
    args.splice(2,0,"");
    console.log(...args);
})
async function CreateConditional(UUID,CondArrDiv,options)
{
    Log(new Error(),"Creating conditional for priority block ",UUID," with options provided: ",options);
    const CondIndex =(options&&options.UUID)?options.UUID:await window.electronAPI.InvokeRendererToMain("CreateDestroyCond",true,UUID)
    const Conditional = document.createElement("conditional-element");
    Conditional.UUID = UUID;
    Conditional.options=options;
    Conditional.CondIndex=CondIndex;
    CondArrDiv.appendChild(Conditional);
}
function RefreshTrackList(UUID,SoundsList,Tracks)
{
    Log(new Error(),"Refreshing track list for priority block ",UUID," with track list: ",Tracks);
    Log(new Error(),"Destroying track list");
    while (SoundsList.firstChild) {
        SoundsList.firstChild.remove();
    }
    //recreate all element
    Log(new Error(),"Regenerating track list");
    for(let x=0;x<Tracks.length;x++)
    {
        let NewSoundEntry = document.createElement("div")
        NewSoundEntry.innerHTML=`
            <div>
            ${x+1}. ${Tracks[x].TrackURL.split("\\").pop()}
            <button id=${"DeleteTrackBtn-"+x}>X</button>
            </div>
        `;
        SoundsList.appendChild(NewSoundEntry);
        document.getElementById("DeleteTrackBtn-"+x).addEventListener("click",async()=>{
            Log(new Error(),"calling main to destroy track with uuid: ",Tracks[x].UUID);
            let newTracks = await window.electronAPI.InvokeRendererToMain("RemoveTrack",UUID,Tracks[x].UUID);
            (newTracks)?RefreshTrackList(UUID,SoundsList,newTracks):RefreshTrackList(UUID,SoundsList,[]);
        })
    }
}
async function CreateOutput(UUID,OutputDiv,options)
{
    Log(new Error(),`Creating output for priority block ${UUID}. options parameter: `,options)
    const OutputUUID = (options&&options.UUID)?options.UUID:await window.electronAPI.InvokeRendererToMain("CreateDestroyOutput",true,UUID);
    // console.log("UUID: ",UUID);
    let NewOutput=document.createElement("li")
    NewOutput.innerHTML=`
    <select class="OutputSelect" id=${"OutputSelect-"+(UUID)+"-"+(OutputUUID)}>   
        <option ${(options&&options.cmd=="play")?"selected":""} value="play">Start playing from track(s)</option> 
        <option ${(options&&options.cmd=="stop")?"selected":""} value="stop">Stop playing lower-priority track(s)</option>
        <option ${(options&&options.cmd=="play-all")?"selected":""} value="play-all">Start playing all tracks</option>
        <option ${(options&&options.cmd=="prevent")?"selected":""} value="prevent">Prevent lower-priority tracks from playing</option>
        <option ${(options&&options.cmd=="add")?"selected":""} value="add">Add X stacks of</option>
        <option ${(options&&options.cmd=="sub")?"selected":""} value="sub">Subtract X stacks of</option>
        <option ${(options&&options.cmd=="set")?"selected":""} value="set">Set X stacks of</option>
    </select>
    <select class="OutputStackSelect" style=${(options&&(options.cmd=="add"||options.cmd=="sub"||options.cmd=="set"))?"display:inline-block;":"display:none;"} id=${"OutputStackSelect-"+(UUID)+"-"+(OutputUUID)}>
        <option ${(options&&options.stack=="Jackpot")?"selected":""}>Jackpot</option>
        <option ${(options&&options.stack=="Schum")?"selected":""}>Schum</option>
        <option ${(options&&options.stack=="Sweet")?"selected":""}>Sweet</option>
        <option ${(options&&options.stack=="Bloodbath")?"selected":""}>Bloodbath</option>
        <option ${(options&&options.stack=="Fool")?"selected":""}>Fool</option>
        <option ${(options&&options.stack=="Booyah")?"selected":""}>Booyah</option>
        <option ${(options&&options.stack=="Pizza")?"selected":""}>Pizza</option>
        <option ${(options&&options.stack=="Die")?"selected":""}>Die</option>
        <option ${(options&&options.stack=="Deadweight")?"selected":""}>Deadweight</option>
        <option ${(options&&options.stack=="Sundae")?"selected":""}>Sundae</option>
        <option ${(options&&options.stack=="Power")?"selected":""}>Power</option>
        <option ${(options&&options.stack=="Streak")?"selected":""}>Streak</option>
    </select>
    <div class="OutputXDiv" style=${(options&&(options.cmd=="add"||options.cmd=="sub"||options.cmd=="set"))?"display:inline-block;":"display:none;"}>
    X=<input value=${(options&&options.value)?options.value:"0"} class="OutputXInput" type="number" id=${"OutputXInput-"+(UUID)+"-"+(OutputUUID)}></input>
    </div>
    
    <button class="OutputCloseBtn" id=${"OutputCloseBtn-"+(UUID)+"-"+(OutputUUID)}>X</button>
    `
    OutputDiv.appendChild(NewOutput)
    let OutputSelect = NewOutput.querySelector(".OutputSelect")
    let OutputStackSelect = NewOutput.querySelector(".OutputStackSelect")
    let OutputXInput = NewOutput.querySelector(".OutputXInput")
    let OutputCloseBtn = NewOutput.querySelector(".OutputCloseBtn")
    let OutputXDiv=NewOutput.querySelector(".OutputXDiv")
    
    OutputCloseBtn.addEventListener("click",async()=>{
        Log(new Error(),`Destroying output with UUID ${OutputUUID} with priority block with UUID ${UUID}`)
        await window.electronAPI.InvokeRendererToMain("CreateDestroyOutput",false,UUID,OutputUUID)
        NewOutput.remove()
    })
    OutputSelect.addEventListener("change",()=>{
        Log(new Error(),`Changing output with UUID ${OutputUUID} within proririoty block with UUID ${UUID} to type ${OutputSelect.value}`)
        if(["sub", "add", "set"].includes(OutputSelect.value)){
            OutputXDiv.style.display="inline-block"
            OutputStackSelect.style.display="inline-block"
        }else{
            OutputXDiv.style.display="none"
            OutputStackSelect.style.display="none"
        }
        window.electronAPI.SignalToMain("ChangeOutputValue",UUID,OutputUUID,"cmd",OutputSelect.value)
    })
    OutputStackSelect.addEventListener("change",()=>{
        Log(new Error(),`Changing output with UUID ${OutputUUID} within proririoty block with UUID ${UUID} to stack ${OutputStackSelect.value}`)
        window.electronAPI.SignalToMain("ChangeOutputValue",UUID,OutputUUID,"stack",OutputStackSelect.value)
    })
    OutputXInput.addEventListener("change",()=>{
        OutputXInput.valueAsNumber=Math.floor(OutputXInput.valueAsNumber)
        Log(new Error(),`Changing output with UUID ${OutputUUID} within proririoty block with UUID ${UUID} to value ${OutputXInput.value}`)
        window.electronAPI.SignalToMain("ChangeOutputValue",UUID,OutputUUID,"value",OutputXInput.valueAsNumber)
    })
}

async function CreatePriorityBlock(UUID,options,optionalX)
{
    Log(new Error(),`Creating priority block with UUID ${UUID} and options payload: `,options);
    let numOfPriorities=await window.electronAPI.InvokeRendererToMain("GetNumOfPriorities");
    Log(new Error(),`Number of priority blocks that exist currently: ${numOfPriorities}`)
    PlayBtn.style.display="inline-block"
    document.querySelectorAll(".column-display").forEach(element=>element.style.display="inline-block")
    let NewPriorityBlockDiv = document.createElement("div")
    NewPriorityBlockDiv.classList.add("priority-block") 
    NewPriorityBlockDiv.id = UUID
    NewPriorityBlockDiv.innerHTML=`
        <!-- priorityblock_header is here-->

        <span class=w-100 id=${"StatusSpan-"+UUID}>Status: 🟠scanning</span><br>

        <!--blocktype-starttype is here-->

        <div class="conditional-form" id=${"condForm-"+(UUID)} style=${(options&&options.blockType=="conditional")?"display:none;":"display:inline-block;"}>
            Every <input id=${"HeartbeatInput-"+(UUID)} type=\"number\" min=\"1\" value=${(savedHeartbeat)?savedHeartbeat:5}> miliseconds, I will check<br>
            <select id=${"SpellslotSelect-"+(UUID)}>
                <option ${(options&&options.spellSlot==4)?"selected":""} value=4>ability R</option>
                <option ${(options&&options.spellSlot==3)?"selected":""} value=3>ability E</option>
                <option ${(options&&options.spellSlot==2)?"selected":""} value=2>ability W</option>
                <option ${(options&&options.spellSlot==1)?"selected":""} value=1>ability Q</option>
                <option ${(options&&options.spellSlot==0)?"selected":""} value=0>ability Passive</option>
                <option ${(options&&options.spellSlot==5)?"selected":""} value=5>champion buff location</option>
                <option ${(options&&options.spellSlot==6)?"selected":""} value=6>a custom location</option>
            </select>  
            <!-- SHOW THIS ONLY IF OPTIONS.SPELLSLOT<5 -->
            <span>
                <select id=${"ScanTypeSelect-"+(UUID)}>
                    <option id=${"ScanOptionBorder-"+UUID} ${(options&&options.scanType=="pixel")?"selected":""} value="pixel">${((options&&options.spellSlot>=5))?"":"'s Border "}for a pixel</option>
                    <option id=${"ScanOptionIcon-"+UUID} ${(options&&options.scanType=="image")?"selected":""} value="image">${((options&&options.spellSlot>=5))?"":"'s Icon "}for an image</option>
                </select>

                <button id=${"ScanImageBrowseBtn-"+UUID} style=${(options&&options.scanType=="image")?"display:inline-block;":"display:none;"}>Browse</button>
                <span class="shimmer text-gradient-bg tertiary-to-lighter-tertiary" id=${"ScanImageSpan-"+UUID} style=${(options&&options.scanType=="image")?"display:inline-block;":"display:none;"}>
                    ${(options&&options.ScanImagePath)?options.ScanImagePath.split(/[/\\]/).pop():""}
                </span>

                <input value=${(options&&options.scanColorCustomRGB)?options.scanColorCustomRGB:"#000000"} id=${"ScanCustomColorInput-"+UUID} style=${(options&&options.scanType=="pixel"&&options.spellSlot>=5)?"display:inline-block;":"display:none;"} type=color></input>
                
                <span id=${"ScanCustomLocationInput-"+UUID} style=${(options&&options.spellSlot==6)?"display:inline-block;":"display:none;"}>
                    at
                    X:<input id=${"CustomLocationInputX-"+UUID} type=number value=${(options&&options.scanCustomLocation&&options.scanCustomLocation.length>0)?options.scanCustomLocation[0]:"0"}></input>
                    Y:<input id=${"CustomLocationInputY-"+UUID} type=number value=${(options&&options.scanCustomLocation&&options.scanCustomLocation.length>0)?options.scanCustomLocation[1]:"0"}></input>
                </span>
            </span>
            <span id=${"SpellOptionsSpan-"+UUID} style=${(options&&options.spellSlot>=5)?"display:none;":"display:inline-block;"}>
                 At 
                <select id=${"ScanLocationSelect-"+(UUID)}>
                    <option ${(options&&options.scanSpellLocation=="border-start")?"selected":""} value=\"border-start\">border start</option>
                    <option ${(options&&options.scanSpellLocation=="border-end")?"selected":""} value=\"border-end\">border end</option>
                    <option ${(options&&options.scanSpellLocation=="border-half-way")?"selected":""} value=\"border-half-way\">border half-way</option>
                </select>
                , I will look for 
                <select id=${"ScanColorSelect-"+(UUID)}>
                    <option ${(options&&options.scanColorType=="yellow")?"selected":""} value="yellow">yellow color</option>
                    <option ${(options&&options.scanColorType=="gold")?"selected":""}   value="gold">gold color</option>
                    <option ${(options&&options.scanColorType=="silver")?"selected":""} value="silver">silver color</option>
                    <option ${(options&&options.scanColorType=="glimmer")?"selected":""}value="glimmer">glimmer color</option>
                    <option ${(options&&options.scanColorType=="custom")?"selected":""} value="custom">custom color</option>
                </select>
                <input value=${(options&&options.scanColorCustomRGB)?options.scanColorCustomRGB:"#000000"} id=${"SpellCustomColorInput-"+UUID} style=${(options&&options.scanColorType=="custom")?"display:inline-block;":"display:none;"} type=color></input>
            </span>
            and if I found it, I will have found my correct target. 
            <br>If I find the correct target with confidence of <input id=${"ConfidenceInput-"+(UUID)} type=\"number\" min=\"0\" max=\"1\" value=${(options&&options.confidence)?options.confidence:"0.7"} >(0-1),
            </div>
            <div class="w-100">
                I will
                <button id=${"AddOutputBtn-"+(UUID)}>Add action</button>
                <div id=${"OutputDiv-"+(UUID)}></div>
                and will switch to \"playing\" mode.
                <br>
            </div>
        </div>

        <div class="w-100" id=${"ending-form-"+UUID}>
            <p id=${"CondTitle-"+UUID} class=\"TracksTitle\">CONDITIONALS</p>
            <button id=${"AddCondBtn-"+(UUID)}>Add a conditional</button>
            <div id=${"CondArrDiv-"+(UUID)}></div>
            <div id=${"add-tracks-div-"+UUID} class="flex w-100 flex-wrap">
                <p class=\"TracksTitle\">TRACKS</p>
                <button id=${"SoundsBtn-"+(UUID)}>ADD SFX</button>
            </div>
            <div class="shimmer text-gradient-bg quaternary-to-lighter-quaternary" id=${"SoundsList-"+(UUID)}></div>
        </div>
    `
    PriorityContainer.appendChild(NewPriorityBlockDiv)
    
    //#region element variables
    let pixelCoordInput = document.getElementById("customCoordInput-"+(UUID))
    let customColorInput = document.getElementById("SpellCustomColorInput-"+(UUID))
    let heartbeatInput = document.getElementById("HeartbeatInput-"+(UUID))
    let SpellslotSelect = document.getElementById("SpellslotSelect-"+(UUID))
    let ScanLocationSelect = document.getElementById("ScanLocationSelect-"+(UUID))
    let ScanColorSelect = document.getElementById("ScanColorSelect-"+(UUID))
    let ConfidenceInput = document.getElementById("ConfidenceInput-"+(UUID))
    let SoundsList = document.getElementById("SoundsList-"+(UUID))
    let SoundsBtn = document.getElementById("SoundsBtn-"+(UUID))
    let AddCondBtn = document.getElementById("AddCondBtn-"+(UUID))
    let CondArrDiv = document.getElementById("CondArrDiv-"+(UUID)) 
    let OutputDiv = document.getElementById("OutputDiv-"+(UUID)) 
    let condForm = document.getElementById("condForm-"+(UUID))
    let CustomLocationInputX = document.getElementById("CustomLocationInputX-"+(UUID))
    let CustomLocationInputY = document.getElementById("CustomLocationInputY-"+(UUID))
    let AddOutputBtn = document.getElementById("AddOutputBtn-"+(UUID))
    let ScanTypeSelect=document.getElementById("ScanTypeSelect-"+(UUID))
    let ScanImageBrowseBtn = document.getElementById("ScanImageBrowseBtn-"+UUID)
    let ScanImageSpan = document.getElementById("ScanImageSpan-"+UUID)
    let ScanCustomColorInput = document.getElementById("ScanCustomColorInput-"+UUID)
    let SpellCustomColorInput = document.getElementById("SpellCustomColorInput-"+UUID)
    let ScanOptionBorder = document.getElementById("ScanOptionBorder-"+UUID)
    let ScanOptionIcon = document.getElementById("ScanOptionIcon-"+UUID)
    let ScanCustomLocationInput=document.getElementById("ScanCustomLocationInput-"+UUID)
    let SpellOptionsSpan = document.getElementById("SpellOptionsSpan-"+UUID)
    let StatusSpan=document.getElementById("StatusSpan-"+UUID)
    let endingform = document.getElementById("ending-form-"+UUID)
    let addtracksdiv = document.getElementById("add-tracks-div-"+UUID)
    let CondTitle = document.getElementById("CondTitle-"+UUID)
    //#endregion
    let postTrack = document.createElement("posttrack-ops")
    postTrack.UUID = UUID
    postTrack.options=(options&&options.PostTrackOperations)?options.PostTrackOperations:undefined;
    NewPriorityBlockDiv.insertBefore(postTrack,endingform)
    // NewPriorityBlockDiv.appendChild(postTrack)

    let trackoptions = document.createElement("track-options")
    trackoptions.UUID=UUID
    trackoptions.options=options
    endingform.insertBefore(trackoptions,CondTitle)

    let priorityblock_header = document.createElement("priorityblock-header")
    priorityblock_header.UUID=UUID
    priorityblock_header.options=options
    priorityblock_header.optionalX=optionalX
    priorityblock_header.numOfPriorities=numOfPriorities
    NewPriorityBlockDiv.insertBefore(priorityblock_header,StatusSpan)

    let blocktype_starttype = document.createElement("blocktype-starttype")
    blocktype_starttype.options=options
    blocktype_starttype.UUID=UUID,
    blocktype_starttype.condForm=condForm
    NewPriorityBlockDiv.insertBefore(blocktype_starttype,condForm)

    AddOutputBtn.addEventListener("click",()=>{
        CreateOutput(UUID,OutputDiv)
    })
    function SaveLocation()
    {
        Log(new Error(),`Saving custom location values {${Math.floor(CustomLocationInputX.valueAsNumber)},${Math.floor(CustomLocationInputY.valueAsNumber)}} in priority block with UUID ${UUID}`)
        CustomLocationInputX.valueAsNumber=Math.floor(CustomLocationInputX.valueAsNumber)
        CustomLocationInputY.valueAsNumber=Math.floor(CustomLocationInputY.valueAsNumber)
        let LocationValues = [CustomLocationInputX.valueAsNumber,CustomLocationInputY.valueAsNumber]
        window.electronAPI.SignalToMain("ChangeValue",UUID,"scanCustomLocation",LocationValues)
    }
    CustomLocationInputX.addEventListener("change",SaveLocation)
    CustomLocationInputY.addEventListener("change",SaveLocation)
    AddCondBtn.addEventListener("click",()=>{
        CreateConditional(UUID,CondArrDiv)
    })
    heartbeatInput.addEventListener("change",()=>{
        Log(new Error(),`Setting global scanner heartbeat to ${heartbeatInput.valueAsNumber}`)
        window.electronAPI.SignalToMain("ChangeHeartbeat",heartbeatInput.valueAsNumber)
    })
    window.electronAPI.SignalToRenderer("UpdateHeartbeat",(input)=>{
        Log(new Error(),`Recieving new global heartbeat value from Main: ${input}`)
        heartbeatInput.value = input
        savedHeartbeat=input
    })
    SpellCustomColorInput.addEventListener("change",()=>{
        Log(new Error(),`Setting custom scan color value in priority block with UUID ${UUID} to ${SpellCustomColorInput.value}`)
        ScanCustomColorInput.value=SpellCustomColorInput.value
        window.electronAPI.SignalToMain("ChangeValue",UUID,"scanColorCustomRGB",SpellCustomColorInput.value) 
    })
    ScanCustomColorInput.addEventListener("change",()=>{
        Log(new Error(),`Setting custom scan color value in priority block with UUID ${UUID} to ${ScanCustomColorInput.value}`)
        SpellCustomColorInput.value=ScanCustomColorInput.value
        window.electronAPI.SignalToMain("ChangeValue",UUID,"scanColorCustomRGB",ScanCustomColorInput.value) 
    })
    ScanImageBrowseBtn.addEventListener("click",async()=>{
        Log(new Error(),`Asking Main process to open dialog box to pick TrackURL for priority block with UUID ${UUID}`)
        let Path = await window.electronAPI.InvokeRendererToMain("OpenImg",UUID)
        Log(new Error(),`TrackURL recieved: ${Path}`)
        if(Path){
            Log(new Error(),`Setting TrackURL to ${Path.split(/[/\\]/).pop()}`)
            ScanImageSpan.innerHTML=Path.split(/[/\\]/).pop()
        }else{
            Log(new Error(),`TrackURL is empty. Resetting TrackURL to empty value`)
            ScanImageSpan.innerHTML=""
        }
    })
    ScanTypeSelect.addEventListener("change",()=>{ 
        Log(new Error(),`Setting scan type in priority block with UUID ${UUID} to ${ScanTypeSelect.value}`);
        if(ScanTypeSelect.value=="image"){
            ScanImageBrowseBtn.style.display="inline-block"
            ScanImageSpan.style.display="inline-block"
        }else{
            ScanImageBrowseBtn.style.display="none"
            ScanImageSpan.style.display="none"
        }
        (SpellslotSelect.value<5&&ScanTypeSelect.value=="pixel")?SpellOptionsSpan.style.display="inline-block":SpellOptionsSpan.style.display="none";
        (ScanTypeSelect.value=="pixel"&&SpellslotSelect.value>=5)?ScanCustomColorInput.style.display="inline-block":ScanCustomColorInput.style.display="none";
        window.electronAPI.SignalToMain("ChangeValue",UUID,"scanType",ScanTypeSelect.value)
    })
    SpellslotSelect.addEventListener("change",()=>{
        Log(new Error(),`Setting spell slot within priority block with UUID ${UUID} to ${SpellslotSelect.value}`)
        if(SpellslotSelect.value==5&&SpellslotSelect.value=="pixel"){
            ScanCustomColorInput.style.display="inline-block"
        }else{
            ScanCustomColorInput.style.display="none"
        }
        (ScanTypeSelect.value=="pixel"&&SpellslotSelect.value>=5)?ScanCustomColorInput.style.display="inline-block":ScanCustomColorInput.style.display="none";
        (SpellslotSelect.value<5&&ScanTypeSelect.value=="pixel")?SpellOptionsSpan.style.display="inline-block":SpellOptionsSpan.style.display="none"
        ScanOptionBorder.text=`${(SpellslotSelect.value<5)?"'s Border ":""}for a pixel`
        ScanOptionIcon.text=`${(SpellslotSelect.value<5)?"'s Icon ":""}for an image`
        ScanCustomLocationInput.style.display=(SpellslotSelect.value==6)?"inline-block":"none"
        window.electronAPI.SignalToMain("ChangeValue",UUID,"spellSlot",+SpellslotSelect.value)
    })
    ScanLocationSelect.addEventListener("change",()=>{
        Log(new Error(),`setting scan location for priority block with UUID ${UUID} to ${ScanLocationSelect.value}`)
        //Assertation
        ScanLocationSelect.value = ["border-start", "border-end", "border-half-way"].includes(ScanLocationSelect.value) ? ScanLocationSelect.value : "border-start";
        window.electronAPI.SignalToMain("ChangeValue",UUID,"scanLocation",ScanLocationSelect.value);
    })
    ScanColorSelect.addEventListener("change",()=>{
        Log(new Error(),`setting scan color for priority block with UUID ${UUID} to ${ScanColorSelect.value}`)
        //Assertation
        ScanColorSelect.value = ["yellow","gold", "silver","glimmer", "custom"].includes(ScanColorSelect.value) ? ScanColorSelect.value : "yellow";
        (ScanColorSelect.value=="custom")?customColorInput.style.display="inline-block":customColorInput.style.display="none"
        //Confirmation
        window.electronAPI.SignalToMain("ChangeValue",UUID,"scanColorType",ScanColorSelect.value);
    })
    ConfidenceInput.addEventListener("change",()=>{
        Log(new Error(),`setting confidence for priority block with UUID ${UUID} to ${ConfidenceInput.value}`)
        //Assertation
        ConfidenceInput.valueAsNumber = ConfidenceInput.valueAsNumber.clamp(0,1)
        //Confirmation
        window.electronAPI.SignalToMain("ChangeValue",UUID,"confidence",ConfidenceInput.valueAsNumber)
    })
    SoundsBtn.addEventListener("click",async()=>{
        Log(new Error(),`Asking Main process to open dialog box to pick track`)
        //pub the track, and get a return of them and get num of tracks
        const Tracks = await window.electronAPI.InvokeRendererToMain("OpenTrack",UUID);
        Log(new Error(),`Track selected:`,Tracks);
        //delete all previous elements
        if (Tracks) RefreshTrackList(UUID,SoundsList,Tracks);
    })
    if(options&&options.conditionalArray)
    {
        options.conditionalArray.forEach((element)=>{
            CreateConditional(UUID,CondArrDiv,element)
        })
    }
    if(options&&options.outputArray)
    {
        options.outputArray.forEach((element)=>{
            CreateOutput(UUID,OutputDiv,element)
        })
    }
    if(options&&options.Tracks)RefreshTrackList(UUID,SoundsList,options.Tracks);
}

window.electronAPI.SignalToRenderer("UpdateDisplaySelection",(numOfDisplays)=>{
    Log(new Error(),"Updating the display selection. NumOfDisplays: ",numOfDisplays);    
    NumOfDisplays=numOfDisplays
    for(let x=0;x<WindowSelection.options.length;x++)
    {
        WindowSelection.remove(x)
    }
    for(let x=0;x<numOfDisplays.length;x++)
    {
        const Option = document.createElement("option")
        Option.value = x
        Option.data = x
        Option.textContent=numOfDisplays[x].label
        WindowSelection.appendChild(Option)
    }
    ResolutionDiv.innerHTML = numOfDisplays[0].size.width+"x"+numOfDisplays[0].size.height
})
window.electronAPI.SignalToRenderer("UpdateAll",(Data)=>{
    Log(new Error(),"Updating everything with this as the payload: ",Data)
    if(Data&&Data.heartbeat)savedHeartbeat=Data.heartbeat;
    (Data&&Data.leagueDir)?LeagueDirSpan.innerHTML=Data.leagueDir:LeagueDirSpan.innerHTML=""
    if(PriorityContainer.children.length>0)
    {
        Array.from(PriorityContainer.children).forEach((element)=>{
            element.remove()
        })
    }
    if(Data&&Data.Blocks&&Data.Blocks.length>0)
    {
        (Data.Blocks.length>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none"
        for(let x=0;x<Data.Blocks.length;x++)
        {
            let Block = Data.Blocks[x]
            CreatePriorityBlock(Block.UUID,Block,x)
        }
    }
})
window.electronAPI.SignalToRenderer("UpdatePlayPauseState",(Value)=>{
    Log(new Error(),"Are the scanners on? ",Value)
    PlayBtn.innerHTML = `${(Value)?"🟥":"▶️"}`
})
window.electronAPI.SignalToRenderer("UpdateValues",(Data)=>{
    if(Data&&Data.Blocks){
        for(let x=0;x<Data.Blocks.length;x++){
            let StatusSpan = document.getElementById("StatusSpan-"+Data.Blocks[x].UUID)
            let emojis={"scanning":"🟠","inactive":"🔴","playing":"🟢"}
            if(StatusSpan){
                StatusSpan.innerText=`Status: ${emojis[Data.Blocks[x].status]}${Data.Blocks[x].status}`
            }else{
                Log(new Error(),"Failed to find priority");
            }
        }
    }
})
window.electronAPI.SignalToRenderer("ToggleMouseDebugTools",(Data)=>{
    Log(new Error(),`Turning mouse debugger ${(Data)?"on":"off"}`);
    (Data)?MouseDebugDiv.style.display="inline-block":MouseDebugDiv.style.display="none"
})
window.electronAPI.SignalToRenderer("MouseDetails",(Data)=>{
    MousePosSpan.innerText=`X:${Data.Pos.x} , Y:${Data.Pos.y}`
    if(typeof Data.Color == "string"){
        MouseColorSpan.innerText=Data.Color
    }else{
        MouseColorSpan.innerText=`R:${Data.Color[0]} , G:${Data.Color[1]} , B:${Data.Color[2]}`
    }
})
createPriorityBtn.addEventListener("click",async(e)=>{
    Log(new Error(),"Creating new priority block")
    let UUID = await window.electronAPI.InvokeRendererToMain("CreatePriority");
    CreatePriorityBlock(UUID)
});
PlayBtn.addEventListener("click",()=>{
    Log(new Error(),"Play/Pause button clicked. Sending signal to Main process")
    window.electronAPI.SignalToMain("PlayPauseScan");
});
LeagueDir.addEventListener("click",async(e)=>{
    Log(new Error(),"Asking Main process for dialog box to select League of Legends installation directory")
    const LeagueDirectory = await window.electronAPI.InvokeRendererToMain("OpenDirDialog")
    if(LeagueDirectory)LeagueDirSpan.innerHTML=LeagueDirectory;
})
let variables_table=document.createElement("variables-table")
variables_table.UUID="none"
document.querySelector(".body").insertBefore(variables_table,document.querySelector(".body-container"))
Log(new Error(),"Loading all modules");
LoadModules()
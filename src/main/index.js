let WindowSelection = document.getElementById("DisplaySelect")
let LeagueDir = document.getElementById("LeagueDir")
let ResolutionDiv = document.getElementById("ResolutionDiv")
let createPriorityBtn = document.getElementById("CreatePriorityButton")
let PlayBtn = document.getElementById("PlayBtn")
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
window.electronAPI.SignalToRenderer("UpdateDisplaySelection",(numOfDisplays)=>{
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
        Option.textContent="Display "+(x+1) +" / "+ numOfDisplays[x].label
        WindowSelection.appendChild(Option)
    }
    ResolutionDiv.innerHTML = numOfDisplays[0].size.width+"x"+numOfDisplays[0].size.height
})
WindowSelection.addEventListener("change",()=>{
    ResolutionDiv.innerHTML = NumOfDisplays[WindowSelection.selectedIndex].size.width+"x"+NumOfDisplays[WindowSelection.selectedIndex].size.height
    window.electronAPI.SignalToMain("ChangeDisplay",WindowSelection.selectedIndex)
})
LeagueDir.addEventListener("click",async(e)=>{
    const LeagueDirectory = await window.electronAPI.InvokeRendererToMain("OpenDirDialog")
    
})
function CreatePriorityBlock(numOfPriorities,options)
{
    (numOfPriorities>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none"
    (numOfPriorities>=7)?createPriorityBtn.style.display="none":createPriorityBtn.style.display="inline-block";
    let PriorityContainer = document.getElementById("PriorityContainer")
    let NewPriorityBlockDiv = document.createElement("div")
    NewPriorityBlockDiv.classList.add("priority-block") 
    NewPriorityBlockDiv.id = numOfPriorities-1
    NewPriorityBlockDiv.innerHTML=`
        <div class=\"flex jc-space-between w-100\">
            <img class=\"priority-icon\" src=\" ${PrioityAssets[numOfPriorities-1].icon}\" />
            <img class=\"priority-title\" src=\" ${PrioityAssets[numOfPriorities-1].title}\" />
            <button class=\"close-btn\" id=${"closeBtw-"+(numOfPriorities-1)}>X</button>
        </div>
        <div>
            I am a 
            <select>
                <option selected>image-scan</option>
                <!-- <option>conditional</option> --!>
            </select>
            audio player and I start
            <select>
                <option>playing</option>
                <option selected>inactive</option>
                <option>disabled</option>
            </select>
            .
        </div>
        <div class="conditional-form" id=${"condForm-"+(numOfPriorities-1)}>
            Every <input id=${"HeartbeatInput-"+(numOfPriorities-1)} type=\"number\" min=\"1\" value=${(savedHeartbeat)?savedHeartbeat:5}> miliseconds, I will check ability
            <select id=${"SpellslotSelect-"+(numOfPriorities-1)}>
                <option ${(options&&options.spellSlot==4)?"selected":""} value=4>R</option>
                <option ${(options&&options.spellSlot==3)?"selected":""} value=3>E</option>
                <option ${(options&&options.spellSlot==2)?"selected":""} value=2>W</option>
                <option ${(options&&options.spellSlot==1)?"selected":""} value=1>Q</option>
                <option ${(options&&options.spellSlot==0)?"selected":""} value=0>Passive</option>
            </select>'s  
            <select>
                <option selected>Border</option>
                <!-- <option>Ability Icon</option> --!>
            </select>
             for a
             <select>
                <option selected>pixel</option>
                <!-- <option>image</option> --!>
            </select>.
            <div>
                At 
                <select id=${"ScanLocationSelect-"+(numOfPriorities-1)}>
                    <option ${(options&&options.scanLocation=="border-start")?"selected":""} value=\"border-start\">border start</option>
                    <option ${(options&&options.scanLocation=="border-end")?"selected":""} value=\"border-end\">border end</option>
                    <!-- <option>border half-way</option> --!> 
                    <option ${(options&&options.scanLocation=="custom")?"selected":""}>custom</option>
                </select>
                <div style=${(options&&options.scanLocation=="custom")?"display:inline-block;":"display:none;"} id=${"customCoordInput-"+(numOfPriorities-1)}>
                    X:<input type="number" min=\"0\" max=${NumOfDisplays[WindowSelection.selectedIndex].size.width} value="0">
                    Y:<input type="number" min=\"0\" max=${NumOfDisplays[WindowSelection.selectedIndex].size.height} value="0">
                </div>
                
                , I will look for 
                <select id=${"ScanColorSelect-"+(numOfPriorities-1)}>
                    <option ${(options&&options.scanColor=="gold")?"selected":""}>gold</option>
                    <option ${(options&&options.scanColor=="silver")?"selected":""}>silver</option>
                    <option ${(options&&options.scanColor=="custom")?"selected":""}>custom</option>
                </select>
                <div style=${(options&&options.scanColor=="custom")?"display:inline-block;":"display:none;"} id=${"customColorInput-"+(numOfPriorities-1)}>
                    R:<input type="number" min=\"0\" max=\"255\" value="0">
                    G:<input type="number" min=\"0\" max=\"255\" value="0">
                    B:<input type="number" min=\"0\" max=\"255\" value="0">
                </div>
                pixel color, and if I found it, I will have found my correct target. 
            </div>
            If I find the correct target with confidence of <input id=${"ConfidenceInput-"+(numOfPriorities-1)} type=\"number\" min=\"0\" max=\"1\" value=${(options&&options.confidence)?options.confidence:"0.7"} >(0-1), I will 
            <select id=${"OutputSelect-"+(numOfPriorities-1)}>
                <option ${(options&&options.output=="stop-and-play")?"selected":""} value=\"stop-and-play\">stop all lower-priority sounds, and play from the music tracks</option>
                <option ${(options&&options.output=="play")?"selected":""} value=\"play\">play from the music tracks</option>
                <option ${(options&&options.output=="add-stack")?"selected":""} value=\"add-stack\">add a stack of </option>
                <option ${(options&&options.output=="sub-stack")?"selected":""} value=\"sub-stack\">subtract a stack of </option>
            </select>
            <div id=${"outputDiv-"+(numOfPriorities-1)}>
                 and be considered \"active.\"
                <br>
                I 
                <select id=${"FadeInSelect-"+(numOfPriorities-1)}>
                    <option ${(options&&!options.bIsFadeIn)?"selected":""} value=\"false\"> will not </option>
                    <option ${(options&&options.bIsFadeIn)?"selected":""} value=\"true\"> will </option>
                </select>
                fade in the audio track. 
                <br>
                I
                <select id=${"FadeOutSelect-"+(numOfPriorities-1)}>
                    <option ${(options&&!options.bIsFadeOut)?"selected":""} value=\"false\"> will not</option>
                    <option ${(options&&options.bIsFadeOut)?"selected":""} value=\"true\"> will </option>    
                </select>
                fade out the audio track. 
                <br>
                I
                <select id=${"IsRandomSelect-"+(numOfPriorities-1)}>
                    <option ${(options&&!options.bIsRandom)?"selected":""} value=\"false\"> will not</option>
                    <option ${(options&&options.bIsRandom)?"selected":""} value=\"true\"> will </option>
                </select>
                play an audio track in a random order. 
            </div>
            
            <button id=${"SoundBtn-"+(numOfPriorities-1)}>ADD SFX</button>
        </div>
    `
    PriorityContainer.appendChild(NewPriorityBlockDiv)
    let pixelCoordInput = document.getElementById("customCoordInput-"+(numOfPriorities-1))
    let pixelColorInput = document.getElementById("customColorInput-"+(numOfPriorities-1))
    let heartbeatInput = document.getElementById("HeartbeatInput-"+(numOfPriorities-1))
    let SpellslotSelect = document.getElementById("SpellslotSelect-"+(numOfPriorities-1))
    let ScanLocationSelect = document.getElementById("ScanLocationSelect-"+(numOfPriorities-1))
    let ScanColorSelect = document.getElementById("ScanColorSelect-"+(numOfPriorities-1))
    let ConfidenceInput = document.getElementById("ConfidenceInput-"+(numOfPriorities-1))
    let OutputSelect = document.getElementById("OutputSelect-"+(numOfPriorities-1))
    let FadeInSelect = document.getElementById("FadeInSelect-"+(numOfPriorities-1))
    let FadeOutSelect = document.getElementById("FadeOutSelect-"+(numOfPriorities-1))
    let IsRandomSelect = document.getElementById("IsRandomSelect-"+(numOfPriorities-1))
    heartbeatInput.addEventListener("change",()=>{
        window.electronAPI.SignalToMain("ChangeHeartbeat",heartbeatInput.valueAsNumber)
    })
    window.electronAPI.SignalToRenderer("UpdateHeartbeat",(input)=>{
        heartbeatInput.value = input
        savedHeartbeat=input
    })
    document.getElementById("closeBtw-"+(numOfPriorities-1)).addEventListener("click",async()=>{
        numOfPriorities = await window.electronAPI.InvokeRendererToMain("RemovePriority",numOfPriorities-1);
        NewPriorityBlockDiv.remove();
        (numOfPriorities>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none";
        (numOfPriorities>=7)?createPriorityBtn.style.display="none":createPriorityBtn.style.display="inline-block";
    })

    SpellslotSelect.addEventListener("change",()=>{
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"spellSlot",+SpellslotSelect.value)
    })
    ScanLocationSelect.addEventListener("change",()=>{
        //Assertation
        ScanLocationSelect.value = ["border-start", "border-end", "custom"].includes(ScanLocationSelect.value) ? ScanLocationSelect.value : "border-start";
        (ScanLocationSelect.value=="custom")?pixelCoordInput.style.display="inline-block":pixelCoordInput.style.display="none";
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"scanLocation",ScanLocationSelect.value);
    })
    ScanColorSelect.addEventListener("change",()=>{
        //Assertation
        ScanColorSelect.value = ["gold", "silver", "custom"].includes(ScanColorSelect.value) ? ScanColorSelect.value : "gold";
        (ScanColorSelect.selectedIndex==2)?pixelColorInput.style.display="inline-block":pixelColorInput.style.display="none"
        //Confirmation
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"scanColorType",ScanColorSelect.value);
    })
    ConfidenceInput.addEventListener("change",()=>{
        //Assertation
        ConfidenceInput.valueAsNumber = ConfidenceInput.valueAsNumber.clamp(0,1)
        //Confirmation
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"confidence",ConfidenceInput.valueAsNumber)
    })
    OutputSelect.addEventListener("change",()=>{
        //Assertation
        OutputSelect.value = ["stop-and-play", "play", "add-stack","sub-stack"].includes(OutputSelect.value) ? OutputSelect.value : "stop-and-play";
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"output",OutputSelect.value)
    })
    FadeInSelect.addEventListener("change",()=>{
        let value = FadeInSelect.value ==="true";
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"bIsFadeIn",value)
    }) 
    FadeOutSelect.addEventListener("change",()=>{
        let value = FadeOutSelect.value ==="true";
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"bIsFadeOut",value)
    })
    IsRandomSelect.addEventListener("change",()=>{
        let value = IsRandomSelect.value ==="true";
        window.electronAPI.SignalToMain("ChangeValue",numOfPriorities-1,"bIsRandom",value)
    })
}

window.electronAPI.SignalToRenderer("UpdateAll",(Data)=>{
    console.log("Data: ",Data);
    if(Data.heartbeat)savedHeartbeat=Data.heartbeat
    if(Data.Blocks&&Data.Blocks.length>0)
    {
        for(let x=0;x<Data.Blocks.length;x++)
        {
            let Block = Data.Blocks[x]
            CreatePriorityBlock(x+1,{
                spellSlot:Block.spellSlot,
                scanStyle:Block.scanStyle,
                scanTarget:Block.scanTarget,
                confidence:Block.confidence,
                output:Block.output,
                scanLocation:Block.scanLocation,
                scanColor:Block.scanColorType,
                bIsFadeIn:Block.bIsFadeIn,
                bIsFadeOut:Block.bIsFadeOut,
                bIsRandom:Block.bIsRandom
            })
        }
    }
})


createPriorityBtn.addEventListener("click",async(e)=>{
    numOfPriorities = await window.electronAPI.InvokeRendererToMain("CreatePriority");
    //create a visual priority block
    CreatePriorityBlock(numOfPriorities)
});


//Get number of Priorities
(async()=>{
    numOfPriorities=await window.electronAPI.InvokeRendererToMain("GetNumOfPriorities");
    (numOfPriorities>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none"
})();


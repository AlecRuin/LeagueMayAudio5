let WindowSelection = document.getElementById("DisplaySelect")
let LeagueDir = document.getElementById("LeagueDir")
let ResolutionDiv = document.getElementById("ResolutionDiv")
let createPriorityBtn = document.getElementById("CreatePriorityButton")
let PlayBtn = document.getElementById("PlayBtn")
let NumOfDisplays,numOfPriorities
let PrioityAssets=[
    {icon:"./assets/icons/D.png",title:"./assets/titles/Dismal.png"},
    {icon:"./assets/icons/C.png",title:"./assets/titles/Crazy.png"},
    {icon:"./assets/icons/B.png",title:"./assets/titles/Badass.png"},
    {icon:"./assets/icons/A.png",title:"./assets/titles/Apocalyptic.png"},
    {icon:"./assets/icons/S.png",title:"./assets/titles/Savage.png"},
    {icon:"./assets/icons/SS.png",title:"./assets/titles/Sick Skills.png"},
    {icon:"./assets/icons/SSS.png",title:"./assets/titles/Smokin Sexy Style.png"}
]
window.electronAPI.SignalToRenderer("UpdateDisplaySelection",(numOfDisplays)=>{
    console.log(numOfDisplays);
    console.log(WindowSelection.options);
    NumOfDisplays=numOfDisplays
    for(let x=0;x<WindowSelection.options.length;x++)
    {
        WindowSelection.remove(x)
    }
    for(let x=0;x<numOfDisplays.length;x++)
    {
        console.log(numOfDisplays[x]);
        const Option = document.createElement("option")
        Option.value = x
        Option.data = x
        Option.textContent="Display "+x +" / "+ numOfDisplays[x].label
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
    console.log(LeagueDirectory);
    
})


createPriorityBtn.addEventListener("click",async(e)=>{
    numOfPriorities = await window.electronAPI.InvokeRendererToMain("CreatePriority");

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
                <option seleected>image-scan</option>
                <option>conditional</option>
            </select>
            audio player and I start
            <select>
                <option>playing</option>
                <option selected>inactive</option>
                <option>disabled</option>
            </select>
        </div>
        <div class="conditional-form" id=${"condForm-"+(numOfPriorities-1)}>
            Every <input id=\"HeartbeatInput\" type=\"number\" min=\"1\" value=\"5\"> miliseconds, I will check ability
            <select>
                <option>Passive</option>
                <option>Q</option>
                <option>W</option>
                <option>E</option>
                <option selected>R</option>
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
                <select id=${"pixelCoordSelect"+(numOfPriorities-1)}>
                    <option>border start</option>
                    <option>border end</option>
                    <option>border half-way</option>
                    <option>custom</option>
                </select>
                <div style=\"display:none;\" id=${"customCoordInput-"+(numOfPriorities-1)}>
                    X:<input type="number" min=\"0\" max=${NumOfDisplays[WindowSelection.selectedIndex].size.width} value="0">
                    Y:<input type="number" min=\"0\" max=${NumOfDisplays[WindowSelection.selectedIndex].size.height} value="0">
                </div>
                
                , I will look for 
                <select id=${"pixelColorSelect"+(numOfPriorities-1)}>
                    <option>gold</option>
                    <option>silver</option>
                    <option>custom</option>
                </select>
                <div style=\"display:none;\" id=${"customColorInput-"+(numOfPriorities-1)}>
                    R:<input type="number" min=\"0\" max=\"255\" value="0">
                    G:<input type="number" min=\"0\" max=\"255\" value="0">
                    B:<input type="number" min=\"0\" max=\"255\" value="0">
                </div>
                pixel color, and if I found it, I will have found my correct target. 
            </div>
            If I find the correct target with confidence of <input type=\"number\" min=\"0\" max=\"1\" value=\"0.7\">, I will 
            <select>
                <option>stop all lower-prioity sounds, and play from the music tracks</option>
                <option>play from the music tracks</option>
                <option>add a stack of </option>
                <option>subtract a stack of </option>
            </select>
            <div id=${"outputDiv-"+(numOfPriorities-1)}>
                 and be considered \"active.\"
                <br>
                I 
                <select>
                    <option selected> will </option>
                    <option> will not </option>
                </select>
                fade in the audio track. 
                <br>
                I
                <select>
                    <option selected> will </option>
                    <option> will not</option>
                </select>
                fade out the audio track. 
                <br>
                I
                <select>
                    <option selected> will </option>
                    <option> will not</option>
                </select>
                play an audio track in a random order. 
            </div>
            
            <button id=${"SoundBtn-"+(numOfPriorities-1)}>SELECT SFX</button>
        </div>
    `
    PriorityContainer.appendChild(NewPriorityBlockDiv)
    let pixelCoordSelect=document.getElementById("pixelCoordSelect"+(numOfPriorities-1))
    let pixelCoordInput = document.getElementById("customCoordInput-"+(numOfPriorities-1))
    let pixelColorInput = document.getElementById("customColorInput-"+(numOfPriorities-1))
    let pixelColorSelect = document.getElementById("pixelColorSelect"+(numOfPriorities-1))
    pixelColorSelect.addEventListener("change",()=>{
        (pixelColorSelect.selectedIndex==2)?pixelColorInput.style.display="inline-block":pixelColorInput.style.display="none"
    })
    pixelCoordSelect.addEventListener("change",()=>{
        (pixelCoordSelect.selectedIndex==3)?pixelCoordInput.style.display="inline-block":pixelCoordInput.style.display="none"
    })
    document.getElementById("closeBtw-"+(numOfPriorities-1)).addEventListener("click",async()=>{
        numOfPriorities = await window.electronAPI.InvokeRendererToMain("RemovePriority",numOfPriorities-1);
        NewPriorityBlockDiv.remove();
        (numOfPriorities>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none";
        (numOfPriorities>=7)?createPriorityBtn.style.display="none":createPriorityBtn.style.display="inline-block";
    })
    //create a visual priority block
});


//TODO Get number of Priorities
(async()=>{
    numOfPriorities=await window.electronAPI.InvokeRendererToMain("GetNumOfPriorities");

    (numOfPriorities>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none"
})();


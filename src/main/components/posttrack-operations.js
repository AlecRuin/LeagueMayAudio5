let className = "posttrack-ops"
import CommonParentUtils from "./parentUtils.js"
import { Log } from "./utils.js";
class PostTrackOps extends CommonParentUtils{
    constructor(){
        super();
        this.div =document.createElement("div")
        this.shadowRoot.appendChild(this.div)
    }
    async createPostOp(PostTrackDivList,options){
        const PostOpUUID = (options&&options.UUID)?options.UUID:await window.electronAPI.InvokeRendererToMain("CreateDestroyPostOp",true,this.UUID);
        let NewOp= document.createElement("div")
        NewOp.innerHTML=`
            <select class="PostOpSelect">
                <option value="play" ${(options&&options.cmd=="play")?"selected":""}>Start playing from track(s) and switch back to \"playing\" mode</option>
                <option value="stop" ${(options&&options.cmd=="stop")?"selected":""}>Stop playing lower-priority track(s)</option>
                <option value="play-all" ${(options&&options.cmd=="play-all")?"selected":""}>Start playing all tracks and switch back to \"playing\" mode</option>
                <option value="prevent" ${(options&&options.cmd=="prevent")?"selected":""}>Prevent lower-priority tracks from playing</option>
                <option value="add" ${(options&&options.cmd=="add")?"selected":""}>Add X stacks of</option>
                <option value="sub" ${(options&&options.cmd=="sub")?"selected":""}>Subtract X stacks of</option>
                <option value="set" ${(options&&options.cmd=="set")?"selected":""}>Set X stacks of</option>
            </select>
            <select class="PostOpStackSelect" style=${(options&&(options.cmd=="add"||options.cmd=="sub"||options.cmd=="set"))?"display:inline-block;":"display:none;"}>
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
            <div class="PostOpXDiv" style=${(options&&(options.cmd=="add"||options.cmd=="sub"||options.cmd=="set"))?"display:inline-block;":"display:none;"}>
                X=<input class="PostOpInputX" value=${(options&&options.value)?options.value:"0"} type="number"></input>
            </div>
            <button class="PostOpCloseBtn">X</button>
        `
        PostTrackDivList.appendChild(NewOp)
        let PostOpCloseBtn = NewOp.querySelector(".PostOpCloseBtn")
        let PostOpInputX = NewOp.querySelector(".PostOpInputX")
        let PostOpSelect= NewOp.querySelector(".PostOpSelect")
        let PostOpXDiv= NewOp.querySelector(".PostOpXDiv")
        let PostOpStackSelect = NewOp.querySelector(".PostOpStackSelect")
        PostOpCloseBtn.addEventListener("click",async ()=>{
            Log(new Error(),`Destroying output with UUID ${PostOpUUID} with priority block with UUID ${this.UUID}`)
            await window.electronAPI.InvokeRendererToMain("CreateDestroyPostOp",false,this.UUID,PostOpUUID)
            NewOp.remove()
        })
        PostOpSelect.addEventListener("change",()=>{
            if(["sub", "add", "set"].includes(PostOpSelect.value)){
                PostOpXDiv.style.display="inline-block"
                PostOpStackSelect.style.display="inline-block"
            }else{
                PostOpXDiv.style.display="none"
                PostOpStackSelect.style.display="none"
            }
            window.electronAPI.SignalToMain("ChangePostOpValue",this.UUID,PostOpUUID,"cmd",PostOpSelect.value)
        })
        PostOpStackSelect.addEventListener("change",()=>{
            Log(new Error(),`Changing output with UUID ${PostOpUUID} within proririoty block with UUID ${this.UUID} to stack ${PostOpStackSelect.value}`)
            window.electronAPI.SignalToMain("ChangePostOpValue",this.UUID,PostOpUUID,"stack",PostOpStackSelect.value)
        })
        PostOpInputX.addEventListener("change",()=>{
            PostOpInputX.valueAsNumber=Math.floor(PostOpInputX.valueAsNumber)
            Log(new Error(),`Changing output with UUID ${PostOpUUID} within proririoty block with UUID ${this.UUID} to value ${PostOpInputX.value}`)
            window.electronAPI.SignalToMain("ChangePostOpValue",this.UUID,PostOpUUID,"value",PostOpInputX.valueAsNumber)
        })
    }


    connectedCallback(){
        try {
            if(!this.UUID)throw new Error("missing UUID");
            super.connectedCallback(className,this.UUID)
            if(this.options)Log(new Error(),"Inbound options for PostOp: ",this.options);
            this.div.innerHTML=`
            When all tracks are finished playing, I will switch to \"scanning\" mode and 
            <button class="AddPostTrackOpBtn">Add action</button>
            <div class="PostTrackDivList" id=${"PostTrackDivList-"+this.UUID}>

            </div>
            `
            let AddPostTrackOp = this.div.querySelector(".AddPostTrackOpBtn")
            let PostTrackDivList = this.div.querySelector(".PostTrackDivList")
            AddPostTrackOp.addEventListener("click",()=>{
                this.createPostOp(PostTrackDivList)
            })
            if(this.options)this.options.forEach(element=>this.createPostOp(PostTrackDivList,element));
        } catch (error) {
            Log(new Error(),error)
            console.error(error);
        }
    }
}
customElements.define(className,PostTrackOps)
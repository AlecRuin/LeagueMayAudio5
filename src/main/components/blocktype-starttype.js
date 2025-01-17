let className= "blocktype-starttype"
import CommonParentUtils from "./parentUtils.js";
class BlockType_Start extends CommonParentUtils{
    constructor(){
        super();
        // this.attachShadow({mode:"open"})
        // this.addStyles()
        this.div = document.createElement("div")
        this.shadowRoot.appendChild(this.div)
    }
    connectedCallback(){
        try {
            if(!this.UUID)throw new Error("missing UUID")
            super.connectedCallback(className,this.UUID)
            this.div.innerHTML=`
                I am a 
                <select class="BlockTypeSelect" id=${"BlockTypeSelect-"+(this.UUID)}>
                    <option ${(this.options&&this.options.blockType=="image-scan")?"selected":""}>image-scan</option>
                    <option ${(this.options&&this.options.blockType=="conditional")?"selected":""}>conditional</option>
                </select>
                audio player and I start
                <select class="StartSelect">
                    <option ${(this.options&&this.options.startStatus=="scanning")?"selected":""}>scanning</option>
                    <option ${(this.options&&this.options.startStatus=="playing")?"selected":""}>playing</option>
                    <option ${(this.options&&this.options.startStatus=="inactive")?"selected":""}>inactive</option>
                </select> mode.
            `
            // window.electronAPI.SignalToRenderer("UpdateAll",this.LogData)
            let StartSelect = this.div.querySelector(".StartSelect")
            let BlockTypeSelect = this.div.querySelector(".BlockTypeSelect")
            StartSelect.addEventListener("change",()=>{
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"startStatus",StartSelect.value)
            })
            BlockTypeSelect.addEventListener("change",()=>{
                // (BlockTypeSelect.value=="image-scan")?condForm.style.display="inline-block":condForm.style.display="none";
                this.dispatchEvent(new CustomEvent("toggle-display",{detail:{UUID:this.UUID,channel:"conditional-form",display:(BlockTypeSelect.value=="image-scan")?"inline-block":"none"}}))   
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"blockType",BlockTypeSelect.value)
            })
        } catch (error) {
            console.error("Error: ",error);
        }
    }
    disconnectedCallback(){
    }
}
customElements.define(className,BlockType_Start)
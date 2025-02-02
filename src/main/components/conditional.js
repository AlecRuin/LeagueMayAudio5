import CommonParentUtils from "./parentUtils.js";
let className = "conditional-element"
import { Log } from "./utils.js";
class Conditional extends CommonParentUtils{
    constructor(){
        super()
        this.div = document.createElement("div")
        this.shadowRoot.appendChild(this.div)
    }
    connectedCallback(){
        try {
            if(!this.UUID)throw new Error("missing UUID");
            if(!this.CondIndex)throw new Error("missing CondIndex");
            super.connectedCallback(className,this.UUID)
            this.div.innerHTML=`
            If
            <select class="CondOperatorSelect" id=${"CondOperatorSelect-"+(this.UUID)+"-"+this.CondIndex}>
                <option ${(this.options&&this.options.condOperator=="")?"selected":""} value=\"\"></option>
                <option ${(this.options&&this.options.condOperator=="==")?"selected":""} value=\"==\">stacks are equal to</option>
                <option ${(this.options&&this.options.condOperator==">=")?"selected":""} value=\">=\">stacks are greater than or equal to</option>
                <option ${(this.options&&this.options.condOperator=="<=")?"selected":""} value=\"<=\">stacks are less than or equal to</option>
                <option ${(this.options&&this.options.condOperator=="<")?"selected":""} value=\"<\">stacks are less than </option>
                <option ${(this.options&&this.options.condOperator==">")?"selected":""} value=\">\">stacks are greater than</option>
            </select>
            <input class="CondInput" value=${(this.options&&this.options.condInput)?this.options.condInput:"0"} id=${"CondInput-"+(this.UUID)+"-"+this.CondIndex} type="number" style=${(this.options&&this.options.condOperator!=""&&this.options.condOperator!=undefined)?"display:inline-block;":"display:none;"}>
            </input>
            <select class="CondStackSelect" id=${"CondStackSelect-"+(this.UUID)+"-"+this.CondIndex} style=${(this.options&&this.options.condOperator!=""&&this.options.condOperator!=undefined)?"display:inline-block;":"display:none;"}>
                <option ${(this.options&&this.options.condStack=="Jackpot")?"selected":""}>Jackpot</option>
                <option ${(this.options&&this.options.condStack=="Schum")?"selected":""}>Schum</option>
                <option ${(this.options&&this.options.condStack=="Sweet")?"selected":""}>Sweet</option>
                <option ${(this.options&&this.options.condStack=="Bloodbath")?"selected":""}>Bloodbath</option>
                <option ${(this.options&&this.options.condStack=="Fool")?"selected":""}>Fool</option>
                <option ${(this.options&&this.options.condStack=="Booyah")?"selected":""}>Booyah</option>
                <option ${(this.options&&this.options.condStack=="Pizza")?"selected":""}>Pizza</option>
                <option ${(this.options&&this.options.condStack=="Die")?"selected":""}>Die</option>
                <option ${(this.options&&this.options.condStack=="Deadweight")?"selected":""}>Deadweight</option>
                <option ${(this.options&&this.options.condStack=="Sundae")?"selected":""}>Sundae</option>
                <option ${(this.options&&this.options.condStack=="Power")?"selected":""}>Power</option>
                <option ${(this.options&&this.options.condStack=="Streak")?"selected":""}>Streak</option>
            </select>,
            I will switch to
            <select class="CondOutputSelect" id=${"CondOutputSelect-"+(this.UUID)+"-"+this.CondIndex}>
                <option ${(this.options&&this.options.condOutput=="")?"selected":""}></option>
                <option ${(this.options&&this.options.condOutput=="playing")?"selected":""}>playing</option>
                <option ${(this.options&&this.options.condOutput=="scanning")?"selected":""}>scanning</option>
                <option ${(this.options&&this.options.condOutput=="inactive")?"selected":""}>inactive</option>
            </select>
            mode.
            <button class="CondCloseBtn">X</button>
            `
            let CondOutputSelect=this.div.querySelector(".CondOutputSelect")
            let CondStackSelect=this.div.querySelector(".CondStackSelect")
            let CondOperatorSelect=this.div.querySelector(".CondOperatorSelect")
            let CondInput=this.div.querySelector(".CondInput");
            CondOutputSelect.addEventListener("change",()=>{
                Log(new Error(),"Setting condition output for condition ",this.CondIndex," inside priority block with UUID ",this.UUID," to ",CondOutputSelect.value);
                window.electronAPI.SignalToMain("ChangeCondValue",this.UUID,this.CondIndex,"condOutput",CondOutputSelect.value)
            })
            CondStackSelect.addEventListener("change",()=>{
                Log(new Error(),"Setting condition stack for condition ",this.CondIndex," inside priority block with UUID ",this.UUID," to ",CondStackSelect.value);
                window.electronAPI.SignalToMain("ChangeCondValue",this.UUID,this.CondIndex,"condStack",CondStackSelect.value)
            })
            CondOperatorSelect.addEventListener("change",()=>{
                Log(new Error(),"Setting condition operator for condition ",this.CondIndex," inside priority block with UUID ",this.UUID," to ",CondOperatorSelect.value);
                (CondOperatorSelect.value!="")?CondInput.style.display="inline-block":CondInput.style.display="none";
                (CondOperatorSelect.value!="")?CondStackSelect.style.display="inline-block":CondStackSelect.style.display="none";
                window.electronAPI.SignalToMain("ChangeCondValue",this.UUID,this.CondIndex,"condOperator",CondOperatorSelect.value)
            })
            CondInput.addEventListener("change",()=>{
                Log(new Error(),"Setting condition input value for condition ",this.CondIndex," inside priority block with UUID ",this.UUID," to ",CondInput.value);
                CondInput.valueAsNumber = Math.floor(CondInput.valueAsNumber);
                window.electronAPI.SignalToMain("ChangeCondValue",this.UUID,this.CondIndex,"condInput",CondInput.valueAsNumber)
            })
            this.div.querySelector(".CondCloseBtn").addEventListener("click",()=>{
                Log(new Error(),"Destroy condition with UUID ",this.CondIndex," inside priority block with UUID ",this.UUID);
                window.electronAPI.InvokeRendererToMain("CreateDestroyCond",false,this.UUID,this.CondIndex)
                this.div.remove()
            })
        } catch (error) {
            Log(new Error(),error)
            console.error(error);
        }
    }
}
customElements.define(className,Conditional)
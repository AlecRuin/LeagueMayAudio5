import CommonParentUtils from "./parentUtils.js";
let className = "track-options"
import { Log } from "./utils.js";
class TrackOptions extends CommonParentUtils{
    constructor(){
        super()
        this.div=document.createElement("div")
        this.shadowRoot.appendChild(this.div)
        this.div.classList.add("w-100")
    }
    connectedCallback(){
        try {
            if(!this.UUID)throw new Error("missing UUID");
            super.connectedCallback(className,this.UUID);
            this.div.innerHTML=`
                <div>
                    I 
                    <select class="FadeInSelect" id=${"FadeInSelect-"+(this.UUID)}>
                        <option ${(this.options&&!this.options.bIsFadeIn)?"selected":""} value=\"false\"> will not </option>
                        <option ${(this.options&&this.options.bIsFadeIn)?"selected":""} value=\"true\"> will </option>
                    </select>
                    fade in the audio track. 
                    <div style=${(this.options&&this.options.bIsFadeIn)?"display:inline-block;":"display:none;"} class="FadeInInputDiv" id=${"FadeInInputDiv-"+(this.UUID)}>
                        Duration:
                        <input type=\"number\"class="FadeInInput" id=${"FadeInInput-"+(this.UUID)} value=${(this.options&&this.options.FadeInDuration)?this.options.FadeInDuration:"1"}></input>
                    </div>
                </div>
                <div>
                    I
                    <select class="FadeOutSelect" id=${"FadeOutSelect-"+(this.UUID)}>
                        <option ${(this.options&&!this.options.bIsFadeOut)?"selected":""} value=\"false\"> will not</option>
                        <option ${(this.options&&this.options.bIsFadeOut)?"selected":""} value=\"true\"> will </option>    
                    </select>
                    fade out the audio track. 
                    <div style=${(this.options&&this.options.bIsFadeOut)?"display:inline-block;":"display:none;"} class="FadeOutInputDiv" id=${"FadeOutInputDiv-"+(this.UUID)}>
                        Duration:
                        <input type=\"number\" class="FadeOutInput" id=${"FadeOutInput-"+(this.UUID)} value=${(this.options&&this.options.FadeOutDuration)?this.options.FadeOutDuration:"1"}></input>
                    </div>
                </div>
                <div>
                    I
                    <select class="IsRandomSelect" id=${"IsRandomSelect-"+(this.UUID)}>
                        <option ${(this.options&&!this.options.bIsRandom)?"selected":""} value=\"false\"> will not</option>
                        <option ${(this.options&&this.options.bIsRandom)?"selected":""} value=\"true\"> will </option>
                    </select>
                    play an audio track in a random order. 
                </div>
                <div>
                    I
                    <select class="UseVisualizerSelect" id=${"UseVisualizerSelect-"+(this.UUID)}>
                        <option ${(this.options&&!this.options.bUseVisualizer)?"selected":""} value=\"false\"> will not</option>
                        <option ${(this.options&&this.options.bUseVisualizer)?"selected":""}  value=\"true\"> will</option>
                    </select>
                    use the audio visualizer overlay <br>(this can increase CPU usage by up to 10%)
                    <br>
                    <div style=${(this.options&&this.options.bUseVisualizer)?"display:inline-block;":"display:none;"} class="VisualizerOptionsDiv" id=${"VisualizerOptionsDiv-"+this.UUID}>
                        Line color: <input value=${(this.options&&this.options.VisualizerLineColor)?this.options.VisualizerLineColor:"#2FD4E3"} type="color" class="VisLineColorInput" id=${"VisLineColorInput-"+this.UUID}></input>
                        Fill: <input type=checkbox class="FillVisInput" id=${"FillVisInput-"+this.UUID} ${(this.options&&this.options.bFillVisualizer)?"checked":""}></input> 
                        <span class="VisColorSpan" id=${"VisColorSpan-"+this.UUID} style=${(this.options&&this.options.bFillVisualizer)?"display:inline-block;":"display:none;"}>
                            Fill color: <input type=color class="FillVisColorInput" id=${"FillVisColorInput-"+this.UUID} value=${(this.options&&this.options.VisualizerFillColor)?this.options.VisualizerFillColor:"#2FD4E3"}></input>
                            Fill pattern: <button class="VisFillPatternBtn" id=${"VisFillPatternBtn-"+this.UUID}>Browse</button>
                            <span class="VisFillPatternSpan shimmer text-gradient-bg secondary-to-lighter-secondary" style=${(this.options&&this.options.VisualizerFillPatternPath)?"display:inline-block;":"display:none;"} id=${"VisFillPatternSpan-"+this.UUID}>${(this.options&&this.options.VisualizerFillPatternPath)?this.options.VisualizerFillPatternPath.split(/[/\\]/).pop():""}
                                <button class="VisFillPatternCloseBtn" id=${"VisFillPatternCloseBtn-"+this.DOCUMENT_FRAGMENT_NODEUUID}>X</button> 
                            </span>
                        </span>
                </div>
            `
            let VisFillPatternBtn = this.div.querySelector(".VisFillPatternBtn")
            let VisFillPatternSpan =  this.div.querySelector(".VisFillPatternSpan")
            let VisFillPatternCloseBtn = this.div.querySelector(".VisFillPatternCloseBtn")
            let FillVisInput = this.div.querySelector(".FillVisInput")
            let VisColorSpan =this.div.querySelector(".VisColorSpan")
            let FillVisColorInput = this.div.querySelector(".FillVisColorInput")
            let VisLineColorInput = this.div.querySelector(".VisLineColorInput")
            let UseVisualizerSelect = this.div.querySelector(".UseVisualizerSelect")
            let VisualizerOptionsDiv = this.div.querySelector(".VisualizerOptionsDiv")
            let FadeOutInput =this.div.querySelector(".FadeOutInput")
            let FadeInInput = this.div.querySelector(".FadeInInput")
            let FadeInSelect =this.div.querySelector(".FadeInSelect")
            let FadeOutSelect = this.div.querySelector(".FadeOutSelect")
            let FadeInInputDiv =this.div.querySelector(".FadeInInputDiv")
            let FadeOutInputDiv = this.div.querySelector(".FadeOutInputDiv")
            let IsRandomSelect = this.div.querySelector(".IsRandomSelect")
            VisFillPatternBtn.addEventListener("click",async()=>{
                Log(new Error(), "asking Main process for dialog box to select visualizer fill pattern url for priority block with UUID ",this.UUID);
                let Path = await window.electronAPI.InvokeRendererToMain("OpenFill",this.UUID)
                Log(new Error(),"given url: ",Path,", for priority block with UUID ",this.UUID);
                if(Path){
                    VisFillPatternSpan.style.display="inline-block"
                    VisFillPatternSpan.innerText=Path.split(/[/\\]/).pop();
                }else{
                    VisFillPatternSpan.style.display="none"
                }
            })
            VisFillPatternCloseBtn.addEventListener("click",()=>{
                Log(new Error(),"removing visualizer fill image from priority block with UUID ",this.UUID);
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"VisualizerFillPatternPath","");
                VisFillPatternSpan.style.display="none";
            })
            FillVisInput.addEventListener("change",()=>{
                Log(new Error(),"setting visualizer fill enabled for priority block with UUID ",this.UUID, " to ", FillVisInput.checked);
                (FillVisInput.checked)?VisColorSpan.style.display="inline-block":VisColorSpan.style.display="none";
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"bFillVisualizer",FillVisInput.checked)
            })
            FillVisColorInput.addEventListener("change",()=>{
                Log(new Error(),"setting visualizer fill color for priority block with UUID ",this.UUID, " to ", FillVisColorInput.value);
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"VisualizerFillColor",FillVisColorInput.value)
            })
            VisLineColorInput.addEventListener("change",()=>{
                Log(new Error(),"setting visualizer line color for priority block with UUID ",this.UUID, " to ", VisLineColorInput.value);
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"VisualizerLineColor",VisLineColorInput.value)
            })
            UseVisualizerSelect.addEventListener("change",()=>{
                let value = UseVisualizerSelect.value ==="true";
                Log(new Error(),"setting visualizer enabled for priority block with UUID ",this.UUID, " to ",value);
                (value)?VisualizerOptionsDiv.style.display="inline-block":VisualizerOptionsDiv.style.display="none";
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"bUseVisualizer",value)
            })
            FadeOutInput.addEventListener("change",()=>{
                Log(new Error(),"setting track fade out timer for priority block with UUID ",this.UUID, " to ",Math.abs(Math.floor(FadeOutInput.valueAsNumber)));
                FadeOutInput.valueAsNumber=Math.abs(Math.floor(FadeOutInput.valueAsNumber))
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"FadeOutDuration",FadeOutInput.valueAsNumber)
            })
            FadeInInput.addEventListener("change",()=>{
                Log(new Error(),"setting track fade in timer for priority block with UUID ",this.UUID, " to ",Math.abs(Math.floor(FadeInInput.valueAsNumber)));
                FadeInInput.valueAsNumber=Math.abs(Math.floor(FadeInInput.valueAsNumber))
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"FadeInDuration",FadeInInput.valueAsNumber)
            })
            FadeInSelect.addEventListener("change",()=>{
                let value = FadeInSelect.value ==="true";
                Log(new Error(),"setting track fade in enabled for priority block with UUID ",this.UUID, " to ",value);
                (value)?FadeInInputDiv.style.display="inline-block":FadeInInputDiv.style.display="none";
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"bIsFadeIn",value)
            }) 
            FadeOutSelect.addEventListener("change",()=>{
                let value = FadeOutSelect.value ==="true";
                Log(new Error(),"setting track fade out enabled for priority block with UUID ",this.UUID, " to ",value);
                (value)?FadeOutInputDiv.style.display="inline-block":FadeOutInputDiv.style.display="none";
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"bIsFadeOut",value)
            })
            IsRandomSelect.addEventListener("change",()=>{
                let value = IsRandomSelect.value ==="true";
                Log(new Error(),"setting random track select for priority block with UUID ",this.UUID, " to ",value);
                window.electronAPI.SignalToMain("ChangeValue",this.UUID,"bIsRandom",value)
            })
        } catch (error) {
            Log(new Error(),error)
            console.error(error);
        }
    }
}
customElements.define(className,TrackOptions)
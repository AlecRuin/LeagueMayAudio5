let className = "priorityblock-header"
import CommonParentUtils from "./parentUtils.js";
class priorityblock_header extends CommonParentUtils{
    constructor(){
        super()
        // this.attachShadow({mode:"open"})
        this.div = document.createElement("div")
        this.shadowRoot.appendChild(this.div)
        this.div.classList.add("flex","jc-space-between","w-100","flex-align-center")
        this.PrioityAssets=[
            {icon:"./assets/icons/D.png",title:"./assets/titles/Dismal.png"},
            {icon:"./assets/icons/C.png",title:"./assets/titles/Crazy.png"},
            {icon:"./assets/icons/B.png",title:"./assets/titles/Badass.png"},
            {icon:"./assets/icons/A.png",title:"./assets/titles/Apocalyptic.png"},
            {icon:"./assets/icons/S.png",title:"./assets/titles/Savage.png"},
            {icon:"./assets/icons/SS.png",title:"./assets/titles/Sick Skills.png"},
            {icon:"./assets/icons/SSS.png",title:"./assets/titles/Smokin Sexy Style.png"}
        ]
    }
    connectedCallback(){
        try {
            if(!this.UUID)throw new Error("missing UUID");
            super.connectedCallback(className,this.UUID);
            let PriorityIndex= this.optionalX||this.numOfPriorities-1
            let PlayBtn = document.getElementById("PlayBtn")
            this.div.innerHTML=`
                ${
                    (this.PrioityAssets[PriorityIndex])?
                    `<img class=\"priority-icon\" src=\" ${this.PrioityAssets[PriorityIndex].icon}\" />
                    <img class=\"priority-title\" src=\" ${this.PrioityAssets[PriorityIndex].title}\" />`
                    :
                    `
                    <h3 class=\"priority-icon\">#${PriorityIndex}</h3>
                    <h2 class=\"priority-title\">Priority ${PriorityIndex}</h2>
                    `
                }
                <button class=\"close-btn\" id=${"closeBtw-"+(this.UUID)}>X</button>         
            `
            this.div.querySelector(".close-btn").addEventListener("click",async()=>{
                this.numOfPriorities = await window.electronAPI.InvokeRendererToMain("RemovePriority",this.UUID);
                const parentOfParent = this.parentElement?.parentElement;
                if (parentOfParent) {
                    parentOfParent.remove(); 
                }
                (this.numOfPriorities>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none";
            })
        } catch (error) {
            console.error("Error: ",error);
        }
    }
}
customElements.define(className,priorityblock_header)
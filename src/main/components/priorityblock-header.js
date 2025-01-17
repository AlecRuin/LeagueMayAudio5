let className = "priorityblock-header"
import CommonParentUtils from "./parentUtils.js";
class priorityblock_header extends CommonParentUtils{
    constructor(){
        super(className)
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
        super.connectedCallback(className);
        let optionalX = Number(this.getAttribute("optionalX"))
        let numOfPriorities = Number(this.getAttribute("numOfPriorities"))
        let PriorityIndex= optionalX||numOfPriorities-1
        let UUID = Number(this.getAttribute("uuid"))
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
            <button class=\"close-btn\" id=${"closeBtw-"+(UUID)}>X</button>         
        `
        this.div.querySelector(".close-btn").addEventListener("click",async()=>{
            numOfPriorities = await window.electronAPI.InvokeRendererToMain("RemovePriority",UUID);
            const parentOfParent = this.parentElement?.parentElement;
            if (parentOfParent) {
                parentOfParent.remove(); 
            }
            (numOfPriorities>0)?PlayBtn.style.display="inline-block":PlayBtn.style.display="none";
        })
    }
}
customElements.define(className,priorityblock_header)
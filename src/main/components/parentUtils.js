class CommonParentUtils extends HTMLElement{
    constructor(className){
        super()
        this.className=className
        this.attachShadow({mode:"open"})
        const link = document.createElement("link")
        link.rel="stylesheet"
        link.href="./index.css"
        this.shadowRoot.appendChild(link)
    }
    connectedCallback(){
        this.addEventListener("toggle-display",(event)=>{
            const {channel,display}=event.detail
            if(this.className==channel)this.style.display=display
        })
    }
}
export default CommonParentUtils
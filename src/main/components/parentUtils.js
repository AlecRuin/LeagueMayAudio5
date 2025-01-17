class CommonParentUtils extends HTMLElement{
    constructor(){
        super()
        this.attachShadow({mode:"open"})
        const link = document.createElement("link")
        link.rel="stylesheet"
        link.href="./index.css"
        this.shadowRoot.appendChild(link)
    }
    connectedCallback(className,UUID){
        this.addEventListener("toggle-display",(event)=>{
            const {InboundUUID,channel,display}=event.detail
            if(className==channel&&UUID==InboundUUID)this.style.display=display
        })
    }
}
export default CommonParentUtils
class OpeningStatement extends HTMLElement{
    connectedCallback(){
        this.innerHTML=`
        <div>
            HELLOW!!!!
        </div>
        `
    }
}
customElements.define("opening-statement",OpeningStatement)
let className = "variables-table"
import CommonParentUtils from "./parentUtils.js";
class variables_table extends CommonParentUtils{
    constructor(){
        super(className);
        // this.attachShadow({mode:"open"})
        this.table = document.createElement("table")
        this.table.innerHTML=`
            <tr>
                <th><img class="micro" src="./assets/dante.png"></th>
                <th>Jackpot</th>
                <td id="jackpot-cell">0</td>
                <th>Bloodbath</th>
                <td id="bloodbath-cell">0</td>
                <th>Pizza</th>
                <td id="pizza-cell">0</td>
                <th >Sundae</th>
                <td id="sundae-cell">0</td>
            </tr>
            <tr>
                <th><img class="micro" src="./assets/vergil.png"></th>
                <th>Schum</th>
                <td id="schum-cell">0</td>
                <th >Fool</th>
                <td id="fool-cell">0</td>
                <th>Die</th>
                <td id="die-cell">0</td>
                <th>Power</th>
                <td id="power-cell">0</td>
            </tr>
            <tr>
                <th><img class="micro" src="./assets/nero.png"></th>
                
                <th>Sweet</th>
                <td id="sweet-cell">0</td>
                <th>Booyah</th>
                <td id="booyah-cell">0</td>
                <th>Deadweight</th>
                <td id="deadweight-cell">0</td>
                <th>Streak</th>
                <td id="streak-cell">0</td>
            </tr>
        `
        this.table.classList.add("m-a")
        this.shadowRoot.appendChild(this.table)
        this.variableCells ={
            "Jackpot":this.shadowRoot.getElementById("jackpot-cell"),
            "Schum":this.shadowRoot.getElementById("schum-cell"),
            "Sweet":this.shadowRoot.getElementById("sweet-cell"),
            "Bloodbath":this.shadowRoot.getElementById("bloodbath-cell"),
            "Fool":this.shadowRoot.getElementById("fool-cell"),
            "Booyah":this.shadowRoot.getElementById("booyah-cell"),
            "Pizza":this.shadowRoot.getElementById("pizza-cell"),
            "Die":this.shadowRoot.getElementById("die-cell"),
            "Deadweight":this.shadowRoot.getElementById("deadweight-cell"),
            "Sundae":this.shadowRoot.getElementById("sundae-cell"),
            "Power":this.shadowRoot.getElementById("power-cell"),
            "Streak":this.shadowRoot.getElementById("streak-cell")
        }
    }
    connectedCallback(){
        super.connectedCallback(className)
        window.electronAPI.SignalToRenderer("UpdateValues",(Data)=>{
            console.log("NEW DATA: ",Data);
            if(Data&&Data.Variables){
                Object.entries(Data.Variables).forEach(([key,value])=>{
                    this.variableCells[key].textContent=value
                })
            }
        })
    }
}
customElements.define(className,variables_table)
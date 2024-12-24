const path = require("node:path")
const {Lame} = require("node-lame")
const AudioContext = require("node-web-audio-api").AudioContext
const fs = require("fs")
const robot=require("robotjs")
const sharp = require("sharp")
/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};
class Script
{
    /**
     * The entire programmable process.  Handles the screen reading.
     */
    #leagueDir
    #selectedScreen
    constructor(){
        /**
         * @type {Block[]}
         */
        this.Blocks = []
        this.currentPriority=0
        this.scanningThread
        this.heartbeat=5
    }
    scaleCoord(coord,screenDimensions)
    {
        const centerX = screenDimensions.x/2
        const centerY = screenDimensions.y/2
        let scaledX = centerX + (coord.x-centerX)*this.scaleFactor
        let scaledY = centerY+(coord.y-centerY)*this.scaleFactor
        scaledX = scaledX.clamp(0,screenDimensions.x)
        scaledY = scaledY.clamp(0,screenDimensions.y)
        return {x:Math.round(scaledX),y:Math.round(scaledY)}
    }
    getLeagueDir()
    {
        return this.#leagueDir
    }
    getSelectedScreen()
    {
        return this.#selectedScreen
    }
    changeLeagueDir(LeagueDir)
    {
        if(this.#leagueDir)fs.unwatchFile(path.join(this.#leagueDir,"Config","PersistedSettings.json"))
        this.#leagueDir=LeagueDir
        let data = fs.readFileSync(path.join(this.#leagueDir,"Config","PersistedSettings.json"))
        this.scaleFactor = JSON.parse(data).files[0].sections[5].settings[16].value * .5+1
        fs.watchFile(path.join(this.#leagueDir,"Config","PersistedSettings.json"),()=>{this.updateScaleFactor()})
    }
    changeSelectedScreen(screenNum)
    {
        //TODO Stop scanning process
        this.#selectedScreen=screenNum
        
    }
    updateScaleFactor()
    {
        let data = fs.readFileSync(path.join(this.#leagueDir,"Config","PersistedSettings.json"))
        this.scaleFactor = JSON.parse(data).files[0].sections[5].settings[16].value * .5+1
        //TODO update all block coords
    }
    /**
     * @param {Block} block 
     */
    addBlock(block)
    {
        this.Blocks.push(block)
    }
    /**
     * @param {number} Index Index to remove from
     */
    removeBlock(index)
    {
        this.Blocks.splice(index,1)
    }

    getPixelColor(x, y) {
        const color = robot.getPixelColor(x, y);
        let [r,g,b]=[parseInt(color.substring(0,2),16),parseInt(color.substring(2,4),16),parseInt(color.substring(4,6),16)];
        return [r,g,b];
    }
    beginScanning()
    {
        if (this.scanningThread)clearInterval(this.scanningThread)
        //this.scanningThread = this.setInterval(this.getPixelColor,this.heartbeat)
    }

    /**
     * @returns {{data}}
     */
    toJSON(){

    }
    /**
     * 
     * @param {{data}} data 
     */
    parseJSON(data)
    {

    }
    #privateFunction()
    {

    }
    //this.$privateFunction()
}
//A segment of the process. Can only have 7 Blocks, each representing a priority over each other
class Block
{
    constructor(fadeIn,fadeOut,isRandom,interrupt,spellSlot){
        this.bIsFadeIn = fadeIn||false,
        this.bIsFadeOut = fadeOut||false
        this.bIsRandom = isRandom||false
        this.status = "inactive"
        this.bShouldInterrupt = interrupt||true
        this.spellSlot = spellSlot||3
        this.scanStyle = "border"
        this.Tracks = []
        this.Coords
    }
    
    /**
     * @param {Track} track 
     */
    addTrack(track)
    {
        this.Tracks.push(track)
    }
    /**
     * @param {number} Index 
     */
    removeTrack(Index)
    {
        this.Tracks.splice(Index,1)
    }
    toJSON()
    {

    }
}
//A audio segment within a block
class Track
{
    constructor()
    {
        this.Source
        this.GainNode
        this.TrackURL
        this.status
    }
}

async function getBuffer(audioContext,filePath)
{
    switch (path.extname(path.join(__dirname,filePath)).toLowerCase())
    {
        case ".mp3":
        const decoder = new Lame({
            output: "buffer"
        }).setFile(path.join(__dirname,filePath));
        await decoder.decode()
        // Decoding finished
        buffer = decoder.getBuffer();
        return await audioContext.decodeAudioData(buffer.buffer)
        case ".wav":
        buffer = fs.readFileSync(path.join(__dirname,filePath))
        return await audioContext.decodeAudioData(buffer.buffer)
    }
}

async function AsyncTween(audioNode, startVolume, endVolume, duration) {
    const stepTime = 10; // Interval time in ms
    const totalSteps = duration / stepTime;
    const volumeStep = (endVolume - startVolume) / totalSteps;

    for (let step = 0; step <= totalSteps; step++) {
        const currentVolume = startVolume + volumeStep * step;
        audioNode.gain.value = currentVolume; // Set volume
        await new Promise((resolve) => setTimeout(resolve, stepTime)); // Wait for the step interval
    }
}

async function getImagePixelColor(imgPath,x,y){
    try {
        const image = sharp(imgPath)
        const meta = await image.metadata()
        if (x<0||y<0||x>=metadata.width||y>=metadata.height) {throw new Error("Coords out of bounds")}
        const rawData = await image.raw().toBuffer()
        const pixelIndex = (y*metadata.width+x)*3;
        const red = rawData[pixelIndex]
        const green = rawData[pixelIndex+1]
        const blue = rawData[pixelIndex+2]
        return {red,green,blue}
    } catch (error) {
        console.log(error);
    }
}
// (async()=>{
//     const imagePath = './example.jpg'; // Replace with your image path
//     const x = 50; // X-coordinate
//     const y = 100; // Y-coordinate
//     if (!fs.existsSync(imagePath)) {
//         console.error('Image file not found');
//         return;
//     }
//     const color = await getPixelColor(imagePath, x, y);
//     console.log(`Color at (${x}, ${y}):`, color);
// })();

module.exports={getBuffer,AsyncTween,Script,Block,Track}
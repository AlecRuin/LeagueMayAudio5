const fs= require("fs")
const path = require("path")
const os = require("os")
let logStream,Dir,mainWindow
let bIsVerboseLogging=false
function SetDir(dir)
{
    Dir=dir
    logStream = fs.createWriteStream(path.join(dir,"./log.txt"),{flags:"a"})
}
function ClearFile()
{
    fs.writeFileSync(path.join(Dir,"./log.txt"),"")
}
function ErrorParse(Error)
{
    return "[ELECTRON] ["+Error.stack.split("\n")[1].split("\\").pop().replace(/[()]/g, "")+"]:"
}
function Log(error,...msg)
{
    const formattedError = ErrorParse(error)
    console.log(formattedError,...msg); 
    if(mainWindow)mainWindow.send("log",formattedError,...msg);
    if(bIsVerboseLogging){
        const finalizedString = msg.map(arg => typeof arg === 'object' ? JSON.stringify(arg,null," ") : (arg==undefined)?arg:arg.toString()).join(' ');
        let now = new Date()
        let formatDate = `[${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}:${String(now.getMilliseconds()).padStart(3, '0')}]`
        logStream.write(`\n${formatDate} `+`${formattedError}`+finalizedString)
    }
}
function WriteStream(payload){
    logStream.write(payload)
}
function SetWindow(window){
    mainWindow=window;
}
function SetVerbosity(value){
    bIsVerboseLogging=value;
}
module.exports={ClearFile,Log,SetDir,SetWindow,SetVerbosity,WriteStream}
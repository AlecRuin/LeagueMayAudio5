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
function serializeToString(input) {
    const seen = new WeakSet();

    return Array.isArray(input) ? input.map(arg => 
        typeof arg === 'object' && arg !== null
        ? JSON.stringify(arg, (key, value) => {
            if (value !== null && typeof value === 'object') {
                if (seen.has(value)) return '[Object object]';
                seen.add(value);
            }
            return value;
            }, " ")
        : (arg === undefined ? arg : arg.toString())
    ).join(" ") : input.toString();
}
  
function Log(error,...msg)
{
    const formattedError = ErrorParse(error)
    console.log(formattedError,...msg); 
    const finalizedString = serializeToString(msg.map(arg => typeof arg === 'object' ? JSON.stringify(arg,null," ") : (arg==undefined)?arg:arg.toString()).join(' '))
    if(mainWindow)mainWindow.send("log",formattedError,finalizedString);
    if(bIsVerboseLogging){
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
module.exports={ClearFile,Log,SetDir,SetWindow,SetVerbosity,WriteStream,serializeToString}
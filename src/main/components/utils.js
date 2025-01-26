export function ErrorParse(Error) {
    return "%c[RENDERER]%c [" + Error.stack.split("\n")[1].split("/").pop().replace(/[()]/g, "") + "]";
}
export function Log(error, ...msg) {
    const formattedError = ErrorParse(error);
    console.log(formattedError, "color: rgb(255, 112, 112);", "", ...msg);
    window.electronAPI.SignalToMain("log", formattedError.replace(/%c/g,"")+":",...msg);
}
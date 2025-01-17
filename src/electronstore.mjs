import Store from "electron-store"
const store = new Store();
export function GetLeagueDirSave()
{
    return store.get("LeagueDirSave")
}
export function SetLeagueDirSave(data)
{
    store.set("LeagueDirSave",data)
}
export function GetSavedScript()
{
    return store.get("SavedScript")
}
export function SetSavedScript(data)
{
    store.set("SavedScript",data)
}
export function GetLoggingState()
{
    return store.get("LoggingState")
}
export function SetLoggingState(data)
{
    store.set("LoggingState",data)
}
export function DeleteAllData()
{
    store.delete("SavedScript")
    store.delete("LeagueDirSave")
}
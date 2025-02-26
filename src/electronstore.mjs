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
export function GetLicenseKey()
{
    return store.get("LicenseKey")
}
export function SetLicenseKey(data)
{
    if(data==undefined){
        store.delete("LicenseKey")
    }else{
        store.set("LicenseKey",data)
    }
}
export function GetJWT()
{
    return store.get("JWT")
}
export function SetJWT(data)
{
    store.set("JWT",data)
}
export function DeleteAllData()
{
    store.delete("SavedScript")
    store.delete("LeagueDirSave")
}
// if(process.env.NODE_ENV!="production")store.delete("JWT");
// if(process.env.NODE_ENV!="production")store.delete("LicenseKey");

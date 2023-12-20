if (typeof browser === "undefined") {
    var browser = chrome;
}
// function injectScript (src, remove) {
//     const script = document.createElement('script');
//     script.src = browser.runtime.getURL(src);
// 	//.s.type = "module";
//     if (remove) 
// 		script.onload = () => script.remove();
//     Object.assign(script.dataset, {
//         extensionBaseUrl: browser.runtime.getURL(""),
//         version: browser.runtime.getManifest().version
//     });
//     var element = (document.head || document.documentElement);
//     element.insertBefore(script, element.firstChild);
// }
//injectScript("discord-inject.js", false);
let port = browser.runtime.connect({name:"discord"}),closeOK=false
port.onMessage.addListener(msg => {
	console.info(msg);
	if(msg.action)
	{
		switch(msg.action)
		{
			case"close":
			closeOK=true
			break;

			default:
			console.warn("Unknown action", msg.action)
		}
	}
	else if(msg.type !== undefined && msg.name !== undefined)
	{
		document.dispatchEvent(new CustomEvent('rpc', {detail: msg}));
		//SetDiscordActivityData(msg)
	}
})
port.onDisconnect.addListener(()=>{
	console.info("port closed")
	if(closeOK)
	{
		closeOK=false
	}
	else
	{
		//location.reload()
	}
})
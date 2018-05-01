let _msgFlag = "TcMsg_oo_";

function getRandomString(length) {
  let text = "",
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < (length || 5); i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function msgHandler(e) {
  const key = e.key;
  const newValue = e.newValue;
  let obj = null;

  if (key.indexOf(_msgFlag) > -1 && newValue) {
    try {
      obj = JSON.parse(newValue);
    } catch (e) {
      this.onmessageerror(e);
    }

    if (
      obj.instanceId !== this.instanceId &&
      obj.channelId === this.channelId &&
      !this.closed
    ) {
      let msg = obj.isJSON ? JSON.parse(obj.message) : obj.message;
      this.onmessage({ data: msg });
      setTimeout(function() {
        window.localStorage.removeItem(key);
      }, 1000);
    }
  }
}

class TabChannel {
  constructor(channelName) {
    if (!window.localStorage) {
      throw new Error("localStorage not available");
    }
    if (!channelName) {
      throw new Error("channel name required");
    }

    this.name = channelName;
    this.channelId = channelName;
    this.handler = msgHandler.bind(this);
    this.instanceId = getRandomString();

    window.addEventListener("storage", this.handler, false);
  }
  postMessage(msg) {
    if (this.closed) {
      this.onmessageerror(new Error("channel closed"));
      return;
    }

    const msgObj = {
      channelId: this.channelId,
      instanceId: this.instanceId,
      isJSON: typeof msg !== "string",
      message: typeof msg === "string" ? msg : JSON.stringify(msg)
    };
    const key = _msgFlag + getRandomString() + "_" + this.channelId;

    try {
      const newValue = JSON.stringify(msgObj);
      window.localStorage.setItem(key, newValue);

      var evt = document.createEvent("StorageEvent");
      evt.initStorageEvent(
        "storage",
        false,
        false,
        key,
        null,
        newValue,
        window.location.href,
        window.localStorage
      );
      window.dispatchEvent(evt);
    } catch (e) {
      this.onmessageerror(e);
    }

    setTimeout(function() {
      window.localStorage.removeItem(key);
    }, 1000);
  }
  close() {
    this.closed = true;
    window.removeEventListener("storage", this.handler);
  }
  onmessage() {
    // override by user
  }
  onmessageerror() {
    // override by user
  }
}

export default window.BroadcastChannel || TabChannel;

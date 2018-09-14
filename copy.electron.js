const fs = require('fs')
const shell = require('shelljs')
const excluded = [ ".git", ".gitignore", "README.md", "LICENSE", "copy.electron.js", "package-lock.json" ];

excluded.push("node_modules")

fs.readdir(".", (err, items) => {
  for (let i = 0; i < items.length; i++) {
     const file = items[i];
     if (excluded.indexOf(file) !== -1) continue;
     console.log("copying " + file);
     shell.exec("cp -rf " + file + " ../masterwallet-desktop/");
  }
  shell.exec("rm -f ../masterwallet-desktop/network/*/*.test.js");
  shell.exec("rm -f ../masterwallet-desktop/ipc/*.test.js");
  shell.exec("rm -f ../masterwallet-desktop/api/*.test.js");

  const fnJson = "./../masterwallet-desktop/package.json";
  const json = JSON.parse(fs.readFileSync(fnJson));

  json.name = "masterwallet-desktop";
  json.description = "MasterWallet Pro - Desktop Wallet for CryptoAsset Management";
  json.main = "main.js";

  fs.writeFileSync(fnJson, JSON.stringify(json, null, 2));
});


